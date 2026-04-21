import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode-terminal';
import { DisconnectReason } from 'baileys';
import { initThumbnails } from '../database/db_thumbnails.js';

// ==================== IMPORTS ====================
import config from '../settings.js';
import { smsg } from '../lib/wrapper.js';
import { parseMs } from '../lib/utils.js';
import { loadPlugins } from '../lib/loadplugins.js';
import { saveBotProfile } from '../database/db_user.js';
import { registerGroupMetadataListeners } from '../lib/groupMetadata.js';

import { createSocket } from './createSocket.js';

export function normalizeJidBot(jid) {
    if (!jid) return jid;
    let [user, domain] = jid.split('@');
    user = user.split(':')[0].split('/')[0];
    domain = domain || (jid.includes('@lid') ? 'lid' : 's.whatsapp.net');
    return `${user}@${domain}`;
}

export async function handleConnectionUpdate(sock, update, plugins, pluginsDir, msgCache, botDb) {

    const { connection, lastDisconnect, qr } = update;

    console.log('[DEBUG CONN]', JSON.stringify(update, null, 2));

    // QR Code
    if (qr && !config.pairing) {
        console.log(chalk.yellow.bold('QR CODE DIBUTUHKAN'));
        qrcode.generate(qr, { small: true }, (str) => console.log(str));
    }

    // Connection Close
    if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.red('Koneksi putus → Code:'), statusCode || 'unknown');

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut &&
            statusCode !== DisconnectReason.badSession &&
            statusCode !== 401;

        if (shouldReconnect) {
            console.log(chalk.yellow('Reconnect dalam 5 detik...'));
            setTimeout(() => {
                createSocket(plugins, pluginsDir, msgCache, botDb).catch(err => {
                    console.error(chalk.red('Gagal reconnect:'), err);
                });
            }, 5000);
        } else {
            console.log(chalk.red.bold('Logged out permanen! Hapus folder session lalu restart.'));
        }
        return;
    }

    if (connection === 'open') {

        await initThumbnails(sock);
        await smsg(sock);

        // Simpan Bot Identity
        global.botJid = normalizeJidBot(sock.user?.id);
        global.botLid = normalizeJidBot(sock.user?.lid || sock.user?.lidJid);

        console.log(chalk.green.bold('[BOT IDENTITY]'));
        console.log(chalk.cyan('   JID :'), chalk.white(global.botJid));
        console.log(chalk.cyan('   LID :'), chalk.white(global.botLid || 'N/A'));

        await handleRestartNotification(sock);

        await printConnectionSuccessAndLoad(sock, plugins, pluginsDir);
    }
}

// ====================== RESTART NOTIFICATION ======================
async function handleRestartNotification(sock) {
    const restartFile = path.join(process.cwd(), 'sampah', 'restart_info.json');
    if (!fs.existsSync(restartFile)) return;

    setTimeout(async () => {
        try {
            const data = JSON.parse(fs.readFileSync(restartFile, 'utf8'));
            const now = Date.now();
            const downtimeMs = now - data.time;
            const uptimeMs = process.uptime() * 1000;

            const dateMati = new Date(data.time).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
            const timeMati = new Date(data.time).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':');
            const dateNyala = new Date(now).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
            const timeNyala = new Date(now).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' }).replace(/\./g, ':');

            const restartCaption = `*Bot Kembali Online!* 🚀

\`Waktu Mati\`
\`\`\`Tanggal : ${dateMati}
Jam     : ${timeMati} WIB\`\`\`

\`Waktu Nyala\`
\`\`\`Tanggal : ${dateNyala}
Jam     : ${timeNyala} WIB\`\`\`

\`Durasi Offline\`
> Waktu : ${parseMs(downtimeMs)}

⏱️ *Uptime Saat Ini:*
> ${parseMs(uptimeMs)} (${uptimeMs.toFixed(0)}ms)`;

            if (data.jid && sock?.sendWithThumbnail) {
                await sock.sendWithThumbnail(data.jid, {
                    text: restartCaption,
                    title: "SYSTEM RESTART SUCCESS",
                    body: `Bot by ${config.ownerName}`,
                    thumbnailName: config.randomThumbnail,
                    faviconName: config.randomFavicon,
                    sourceUrl: config.sourceUrl,
                    renderLargerThumbnail: true
                });

                console.log(`✅ Pesan restart berhasil dikirim ke ${data.jid}.`);
            }

            if (fs.existsSync(restartFile)) fs.unlinkSync(restartFile);

        } catch (e) {
            console.error("Gagal mengirim pesan restart:", e.message);
            if (fs.existsSync(restartFile)) fs.unlinkSync(restartFile);
        }
    }, 2000);
}

// ====================== PRINT SUCCESS + LOAD PLUGINS ======================
async function printConnectionSuccessAndLoad(sock, plugins, pluginsDir) {
    const user = sock.user || {};

    // ✅ FIX: gunakan global.botJid yang sudah di-set di handleConnectionUpdate
    const jid = global.botJid || normalizeJidBot(user.id);

    const number = jid.split('@')[0] || config.botNumber;
    const name = user.name || user.verifiedName || user.pushName || config.botName || 'belum tersedia';
    const lid = global.botLid || 'tidak ada LID';
    const device = user.device || 'tidak terdeteksi';
    const timeNow = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    // Save to database
    saveBotProfile({
        jid: jid,
        name: name,
        lid: normalizeJidBot(user.lid || user.lidJid)
    });

    console.log(chalk.green.bold('\n╔════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║            BANGSULBOTZ CONNECTED SUCCESS           ║'));
    console.log(chalk.green.bold('╚════════════════════════════════════════════════════╝'));

    console.log(chalk.cyan('Waktu Connect       :'), chalk.white(`${timeNow} WIB`));
    console.log(chalk.cyan('JID Lengkap         :'), chalk.white(jid));
    console.log(chalk.cyan('Nomor Bot           :'), chalk.white(number));
    console.log(chalk.cyan('Nama Bot (WA)       :'), chalk.white(name));
    console.log(chalk.cyan('LID (Linked ID)     :'), chalk.white(lid));
    console.log(chalk.cyan('Device Info         :'), chalk.white(device));
    console.log(chalk.cyan('Owner               :'), chalk.white(`${config.ownerName} (${config.owner})`));
    console.log(chalk.cyan('Mode Login Terakhir :'), chalk.white(config.pairing ? 'Pairing Code' : 'QR Scan'));
    console.log(chalk.cyan('Sync History        :'), chalk.white('Disabled (hanya pesan baru)'));
    console.log(chalk.green.bold('\nBot online & siap! Kirim pesan tes ke nomor bot.'));
    console.log(chalk.green.bold('══════════════════════════════════════════════════════'));

    // Load Plugins
    console.log(chalk.cyan('📦 Memuat plugins...'));
    const initialResult = await loadPlugins(pluginsDir);

    plugins.clear();
    initialResult.temp.forEach((v, k) => plugins.set(k, v));

    console.log(chalk.green(`✅ [PLUGINS] Berhasil memuat ${plugins.size} command.`));

    if (initialResult.errors > 0) {
        console.log(chalk.red(`⚠️  [PLUGINS] Terdapat ${initialResult.errors} error saat memuat.`));
    }

    registerGroupMetadataListeners(sock);
}