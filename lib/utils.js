import os from 'os';
import fs from 'fs';
import chalk from 'chalk';
import {getRandomThumb} from '../database/db_thumbnails.js';
import config from '../settings.js';

export function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const parts = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} menit`);
    return parts.join(' ');
}

export function getServerInfo() {
    const totalMemRaw = os.totalmem();
    const freeMemRaw = os.freemem();
    const usedMemRaw = totalMemRaw - freeMemRaw;
    
    const memUsage = process.memoryUsage();
    
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model?.trim() || 'Unknown CPU';
    const cpuCores = cpus.length;
    
    let diskInfo = null;
    try {
        const stats = fs.statvfsSync(os.homedir());
        const totalDisk = stats.blocks * stats.bsize;
        const freeDisk = stats.bfree * stats.bsize;
        const usedDisk = totalDisk - freeDisk;
        
        diskInfo = { 
            total: formatBytes(totalDisk), 
            used: formatBytes(usedDisk), 
            free: formatBytes(freeDisk) 
        };
    } catch {}

    return {
        nodeVersion: process.version,
        env: process.env.NODE_ENV || 'development',
        platformArch: `${os.platform()} (${os.arch()})`,
        hostname: os.hostname(),
        cpu: `${cpuModel} (${cpuCores} cores)`,
        ram: { 
            total: formatBytes(totalMemRaw), 
            used: formatBytes(usedMemRaw), 
            free: formatBytes(freeMemRaw) 
        },
        process: { 
            rss: formatBytes(memUsage.rss), 
            heap: formatBytes(memUsage.heapUsed), 
            pid: process.pid 
        },
        disk: diskInfo,
        uptime: formatUptime(os.uptime()),
        cwd: process.cwd(),
    };
}

export function printServerInfo() {
    const info = getServerInfo();
    console.log(chalk.bgBlue.white.bold(' SERVER / HOSTING INFO (Pre-Connect) '));
    console.log(chalk.gray('───────────────────────────────────────────────────────────────'));
    console.log(chalk.cyan('⚡ Node.js Version     :'), chalk.white(info.nodeVersion));
    console.log(chalk.cyan('⚡ Environment         :'), info.env.toUpperCase() === 'PRODUCTION' ? chalk.green.bold('PRODUCTION') : chalk.yellow.bold(info.env.toUpperCase()));
    console.log(chalk.cyan('💻 Platform / Arch     :'), chalk.white(info.platformArch));
    console.log(chalk.cyan('💻 Hostname            :'), chalk.white(info.hostname));
    console.log(chalk.cyan('💻 CPU                 :'), chalk.white(info.cpu));
    console.log(chalk.cyan('🧠 RAM (Server)'));
    console.log(chalk.gray('      Total           :'), chalk.white(info.ram.total));
    console.log(chalk.gray('      Used            :'), chalk.white(info.ram.used));
    console.log(chalk.gray('      Free            :'), chalk.white(info.ram.free));
    console.log(chalk.cyan('🧠 Process Memory'));
    console.log(chalk.gray('      RSS             :'), chalk.white(info.process.rss));
    console.log(chalk.gray('      Heap Used       :'), chalk.white(info.process.heap));
    console.log(chalk.gray('      PID             :'), chalk.white(info.process.pid));
    if (info.disk) {
        console.log(chalk.cyan('💾 Disk (Home Dir)'));
        console.log(chalk.gray('      Total           :'), chalk.white(info.disk.total));
        console.log(chalk.gray('      Used            :'), chalk.white(info.disk.used));
        console.log(chalk.gray('      Free            :'), chalk.white(info.disk.free));
    }
    console.log(chalk.cyan('⏱️ Uptime Server       :'), chalk.white(info.uptime));
    console.log(chalk.cyan('📂 Current Directory  :'), chalk.white(info.cwd));
    console.log(chalk.gray('───────────────────────────────────────────────────────────────'));
}

export async function sendErrorToOwner(sock, error, m, commandName = 'tidak diketahui') {
    const ownerJid = config.owner + '@s.whatsapp.net';
    const senderJid = m?.sender || 'unknown';
    const senderName = m?.pushName || 'Unknown';
    const chatType = m?.isGroup ? `Grup: ${m.groupName || m.chat}` : 'Private Chat';
    const isiPesan = m?.text || m?.body || '[Tidak ada teks/media]';

    let errorDetail = 'Unknown Error';
    try {
        if (Array.isArray(error)) {
            errorDetail = error.map(e => String(e)).join('\n');
        } else if (error?.stack) {
            errorDetail = error.stack;
        } else if (error?.message) {
            errorDetail = error.message;
        } else {
            errorDetail = String(error);
        }
    } catch (e) {
        errorDetail = String(error || 'Unknown Error');
    }

    const reportToOwner = `⚠️ *REPORT ERROR FITUR* ⚠️

👤 *Pengirim:* ${senderName} (@${senderJid.split('@')[0]})
📂 *Lokasi:* ${chatType}
🛠️ *Fitur:* ${commandName}
💬 *Isi Pesan:* "${isiPesan}"

❌ *Error Detail:*
\`\`\`${errorDetail}\`\`\``.trim();

    const errorMsgToUser = `${config.pesan.error || 'Terjadi kesalahan'}\n\n❌ *Masalah:* \`${error?.message || 'Internal Error'}\`\n\nLaporan otomatis telah dikirim ke owner.`.trim();

    try {
        const randomThumb = config.randomThumbnail;

        await sock.sendWithThumbnail(m.chat, {
            text: errorMsgToUser,
            title: 'Terjadi Kesalahan',
            body: `Command: ${commandName}`,
            thumbnailName: config.randomThumbnail,
            faviconName: config.randomFavicon,
            sourceUrl: config.my?.gh,
            mentions: [config.owner + '@s.whatsapp.net']
        }, m);

        await sock.sendMessage(ownerJid, {
            text: reportToOwner,
            mentions: [ownerJid, senderJid].filter(Boolean)
        }, { quoted: m });

        console.log(chalk.bgRed.black(' ERROR REPORTED & USER NOTIFIED '));
    } catch (sendErr) {
        console.log(chalk.red('Gagal proses laporan error:'), sendErr.message);
    }
}

export const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export async function getNetworkInfo() {
    try {
        const response = await fetch('http://ip-api.com/json/?fields=status,message,country,regionName,city,isp,org,as,query');
        const data = await response.json();
        if (data.status === 'success') {
            return {
                ip: data.query,
                isp: data.isp,
                org: data.org,
                location: `${data.city}, ${data.regionName}, ${data.country}`,
                asn: data.as
            };
        }
    } catch (e) {
        return null;
    }
    return null;
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
export function parseMs(ms) {
    if (typeof ms !== 'number') return 'Baru saja';
    let seconds = Math.floor((ms / 1000) % 60);
    let minutes = Math.floor((ms / (1000 * 60)) % 60);
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));

    let res = [];
    if (days > 0) res.push(`${days} hari`);
    if (hours > 0) res.push(`${hours} jam`);
    if (minutes > 0) res.push(`${minutes} menit`);
    if (seconds > 0 || res.length === 0) res.push(`${seconds} detik`);
    
    return res.join(', ');
}

