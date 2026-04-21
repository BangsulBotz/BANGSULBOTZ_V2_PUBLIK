import { fetchLatestBaileysVersion, makeWASocket } from 'baileys';
import chalk from 'chalk';
import fs from 'fs';
import readline from 'node:readline';
import pino from 'pino';

import config from '../settings.js';
import { getGroupMetadata } from '../store.js';
import { printServerInfo } from '../lib/utils.js';
import { useCustomAuthState } from '../lib/customAuth.js';
import { callUpdateHandler } from '../lib/protection.js';
import { handleMessagesUpsert } from './messageHandler.js';
import { handleConnectionUpdate } from './connectionHandler.js';

export async function createSocket(plugins, pluginsDir, msgCache, botDb) {

    if (!fs.existsSync('./sampah')) fs.mkdirSync('./sampah');

    const { state, saveCreds, clearNonCreds } = useCustomAuthState();

    printServerInfo();
    console.log(chalk.magenta.bold('Memulai koneksi Baileys...'));
    console.log(chalk.cyan('Pairing mode aktif?'), config.pairing ? chalk.green.bold('YA') : chalk.red.bold('TIDAK'));

    // Fetch WA Version
    let version;
    try {
        const fetched = await fetchLatestBaileysVersion();
        version = fetched.version;
        console.log('WA version (fetched):', version, '(latest:', fetched.isLatest, ')');
    } catch (err) {
        console.error('Gagal fetch version, pakai fallback:', err.message);
        version = [2, 3000, 1032884366];
    }

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: !!config.pairing,
        pairingCode: true,
        version,
        maxChattableMessages: 100,
        maxMsgRetryCount: 2,
        syncFullHistory: false,
        shouldSyncMutation: false,
        markOnlineOnConnect: true,
        fireInitQueries: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        cachedGroupMetadata: async (jid) => {
            if (jid?.endsWith('@g.us')) return getGroupMetadata(jid);
            return undefined;
        },
    });

    // Pairing Code Logic
    await handlePairingCode(sock);

    // Event Processor
    sock.ev.process(async (events) => {
        sock.clearNonCreds = clearNonCreds;

        if (events['creds.update']) {
            await saveCreds();
        }

        if (events['connection.update']) {
            const update = events['connection.update'];
            await handleConnectionUpdate(sock, update, plugins, pluginsDir, msgCache, botDb);
        }

        if (events['call']) {
            await callUpdateHandler(sock, events['call']);
        }

        if (events['messages.upsert']) {
            handleMessagesUpsert(sock, events, msgCache, plugins, botDb);
        }
    });

    return sock;
}

// Fungsi untuk pairing
async function handlePairingCode(sock) {
    if (!config.pairing || sock.authState.creds.registered) return;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (t) => new Promise(resolve => rl.question(t, resolve));

    try {
        await new Promise(r => setTimeout(r, 2000));

        let phoneNumber = config.botNumber ? config.botNumber.replace(/[^0-9]/g, '') : '';

        if (!phoneNumber) {
            phoneNumber = await question(chalk.cyan('Masukkan nomor WA (contoh: 6281234567890): '));
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        }

        let pairingCode;
        if (config.customPairing) {
            const customCode = config.customPairing.toString().trim();
            if (customCode.length !== 8) {
                console.log(chalk.red.bold('\n[ERROR] Custom Pairing Code harus tepat 8 karakter!'));
                console.log(chalk.yellow(`Kode saat ini: "${customCode}" (${customCode.length} karakter)`));
                process.exit(1);
            }
            pairingCode = await sock.requestPairingCode(phoneNumber, customCode);
        } else {
            pairingCode = await sock.requestPairingCode(phoneNumber);
        }

        const formattedCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;

        console.log(chalk.bgGreen.black('\n   KODE PAIRING ANDA:   '));
        console.log(chalk.bgWhite.black.bold(`      ${formattedCode}      `));
        console.log(chalk.yellow('\n1. Buka WA > Perangkat Tertaut > Tautkan Perangkat'));
        console.log(chalk.yellow('2. Pilih "Tautkan dengan nomor telepon saja"'));
        console.log(chalk.yellow('3. Masukkan kode di atas.\n'));

    } catch (error) {
        console.error(chalk.red('Gagal mendapatkan pairing code:'), error);
    } finally {
        rl.close();
    }
}