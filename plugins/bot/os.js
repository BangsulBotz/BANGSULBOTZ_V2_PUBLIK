import { getServerInfo, formatUptime, getNetworkInfo, formatBytes } from '../../lib/utils.js';
import process from 'process';
import os from 'os';

export default {
    command: 'os',
    alias: ['sistem', 'serverinfo', 'stats', 'vps'],
    description: 'Cek detail mendalam hardware, network & ISP server',

    async execute(m, sock) {
        const createBar = (p) => {
            const percent = Math.min(Math.max(p, 0), 100);
            const filled = Math.round(percent / 10);
            return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${percent.toFixed(1)}%`;
        };

        const sent = await sock.sendMessage(m.chat, { 
            text: '🔍 _Sedang mengumpulkan data server..._' 
        }, { quoted: m });

        try {
            const info = getServerInfo();
            const net = await getNetworkInfo(); 
            const botUptime = formatUptime(process.uptime());
            
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memPercent = (usedMem / totalMem) * 100;
            
            const memUsageProc = process.memoryUsage();
            const load = os.loadavg();
            const cpuUsage = ((load[0] * 100) / os.cpus().length);

            let text = `*📊 DETAIL RESOURCE SERVER & NETWORK*
━━━━━━━━━━━━━━━━━━━━━━━━

\`NETWORK & ISP INFO\`
> *ISP:* ${net?.isp || 'Unknown'}
> *Org:* ${net?.org || 'Unknown'}
> *IP Public:* ${net?.ip || 'Hidden'}
> *Location:* ${net?.location || 'Unknown'}
> *ASN:* ${net?.asn || 'Unknown'}

\`HARDWARE & OS\`
> *Platform:* ${info.platformArch}
> *Hostname:* ${info.hostname}
> *Node.js:* ${info.nodeVersion}
> *CPU Load:* \`[${createBar(cpuUsage)}]\`
> *CPU Model:*
> ${info.cpu}

\`MEMORY (RAM)\`
> *Usage:* \`[${createBar(memPercent)}]\`
> *Total:* ${formatBytes(totalMem)}
> *Used:* ${formatBytes(usedMem)}
> *Free:* ${formatBytes(freeMem)}
> *Bot RSS:* ${formatBytes(memUsageProc.rss)}
> *Heap Used:* ${formatBytes(memUsageProc.heapUsed)}

\`UPTIME & SERVICE\`
> *Server:* ${info.uptime}
> *Bot:* ${botUptime}
> *Waktu:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

━━━━━━━━━━━━━━━━━━━━━━━━
*BangsulBotz-Optimized* 🚀`;

            await sock.sendMessage(m.chat, { 
                text: text,
                edit: sent.key
            });

        } catch (err) {
            console.error('Error detail OS:', err);
            await sock.sendMessage(m.chat, {
                text: `❌ Gagal mengambil detail: ${err.message}`,
                edit: sent.key
            });
        }
    }
};