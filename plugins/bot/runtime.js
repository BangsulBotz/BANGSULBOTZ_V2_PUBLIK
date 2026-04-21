import os from 'os';
import process from 'process';
import { formatUptime, formatBytes } from '../../lib/utils.js';

export default {
  command: 'runtime',
  alias: ['rt', 'uptime', 'status'],
  description: 'Menampilkan informasi status aktif bot.',
  typing: true,
  
  async execute(m, sock) {
    const uptimeSec = Math.floor(process.uptime());
    const uptimeStr = formatUptime(uptimeSec) || 'kurang dari 1 detik';

    const mem = process.memoryUsage();
    const rss         = formatBytes(mem.rss);
    const heapTotal   = formatBytes(mem.heapTotal);
    const heapUsed    = formatBytes(mem.heapUsed);
    const external    = formatBytes(mem.external);
    const arrayBuffers = formatBytes(mem.arrayBuffers);

    const systemTotalMem = formatBytes(os.totalmem());
    const systemUsedMem  = formatBytes(os.totalmem() - os.freemem());
    const systemFreeMem  = formatBytes(os.freemem());

    const totalSwap = os.totalmem() + os.freemem(); 

    let swapTotal = 'Tidak terdeteksi';
    let swapUsed = 'Tidak terdeteksi';
    let swapFree = 'Tidak terdeteksi';
    let swapUsagePercent = '0%';

    try {
        const fs = await import('fs/promises');
        const swapData = await fs.readFile('/proc/meminfo', 'utf8');
        
        const swapTotalMatch = swapData.match(/SwapTotal:\s+(\d+)/);
        const swapFreeMatch  = swapData.match(/SwapFree:\s+(\d+)/);

        if (swapTotalMatch && swapFreeMatch) {
            const totalKB = parseInt(swapTotalMatch[1]);
            const freeKB  = parseInt(swapFreeMatch[1]);
            const usedKB  = totalKB - freeKB;

            swapTotal = formatBytes(totalKB * 1024);
            swapUsed  = formatBytes(usedKB * 1024);
            swapFree  = formatBytes(freeKB * 1024);

            swapUsagePercent = totalKB > 0 
                ? ((usedKB / totalKB) * 100).toFixed(1) + '%' 
                : '0%';
        }
    } catch (e) {
        swapTotal = formatBytes(os.totalmem()); 
    }

    const cpuCores = os.cpus().length;
    const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(', ');
    const cpuUsagePercent = ((os.loadavg()[0] / cpuCores) * 100).toFixed(1) + '%';

    const nodeVersion = process.version;
    const platform = `${os.platform()} (${os.arch()})`;
    const pid = process.pid;

    const text = `\`\`\`〔 𝙎𝙩𝙖𝙩𝙪𝙨 𝘽𝙤𝙩 〕
    
Uptime Bot : ${uptimeStr}
> Node.js  : ${nodeVersion}
> Platform : ${platform}
> PID      : ${pid}

𝙈𝙚𝙢𝙤𝙧𝙮 𝙐𝙨𝙖𝙜𝙚 (𝙉𝙤𝙙𝙚.𝙟𝙨)
> RSS (total)   : ${rss}
> Heap Total    : ${heapTotal}
> Heap Used     : ${heapUsed}
> External      : ${external}
> ArrayBuffers  : ${arrayBuffers}

𝙎𝙮𝙨𝙩𝙚𝙢 𝙈𝙚𝙢𝙤𝙧𝙮
> Total RAM : ${systemTotalMem}
> Used RAM  : ${systemUsedMem}
> Free RAM  : ${systemFreeMem}

𝙎𝙬𝙖𝙥 𝙈𝙚𝙢𝙤𝙧𝙮
> Total Swap : ${swapTotal}
> Used Swap  : ${swapUsed}
> Free Swap  : ${swapFree}
> Usage      : ${swapUsagePercent}

𝘾𝙋𝙐 𝙄𝙣𝙛𝙤
> Cores        : ${cpuCores}
> Load Average : ${loadAvg}
> Usage (est.) : ${cpuUsagePercent}\`\`\``;

    await sock.sendMessage(m.chat, { text }, { quoted: m });
  }
};