import { formatBytes } from '../../lib/utils.js';

export default {
    command: 'memory',
    alias: ['mem', 'ram','rss'],
    description: 'Menampilkan detail penggunaan RAM bot dalam bentuk statistik.',
    typing: true,

    async execute(m) {
        const mem = process.memoryUsage();
        
        let report = `*── 「 MEMORY USAGE 」 ──*\n\n`;
        report += `◦ *RSS:* ${formatBytes(mem.rss)}\n`;
        report += `◦ *Heap Total:* ${formatBytes(mem.heapTotal)}\n`;
        report += `◦ *Heap Used:* ${formatBytes(mem.heapUsed)}\n`;
        report += `◦ *External:* ${formatBytes(mem.external)}\n`;
        report += `◦ *Array Buffers:* ${formatBytes(mem.arrayBuffers)}`;

        await m.reply(report);
    }
};