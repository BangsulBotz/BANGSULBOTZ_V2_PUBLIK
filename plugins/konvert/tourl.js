import * as scraper from '../../lib/scraper.js';

export default {
    command: 'tourl',
    alias: ['upload', 'uplink'],
    description: 'Mengunggah media/dokumen ke URL publik dengan sistem edit',
    help: '`<reply media>`',

    async execute(m, sock, args) {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || quoted.mimetype || '';
        if (!mime) return m.reply(`Balas media atau dokumen yang ingin diunggah!`);

        try {
            const media = await sock.downloadMediaMessage(quoted);
            const size = (media.length / 1024).toFixed(2); 
            
            const servers = [
                { name: 'Yardansh', fn: scraper.Yardansh },
                { name: 'Uguu', fn: scraper.Uguu }
            ];

            const fileName = quoted.filename || quoted.fileName || 'file_media';
            
            let header = `*📁 MEDIA UPLOADER*\n\n`;
            header += `📄 *File:* ${fileName}\n`;
            header += `📂 *Type:* ${mime}\n`;
            header += `⚖️ *Size:* ${size} KB\n`;
            header += `📅 *Upload:* ${new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(/\./g, ':')} WIB\n\n`;

            let { key } = await sock.sendMessage(m.chat, { 
                text: header + `⏳ Memulai proses upload...` 
            }, { quoted: m });

            let results = [];
            let completedCount = 0;

            for (const server of servers) {
                try {
                    const res = await server.fn(media);
                    let url = res?.url || res;
                    let exp = res?.expiry || '∞ Non-Expired';

                    if (!url) throw new Error();

                    results.push(`✅ *${server.name}*\n⏳ *Exp:* ${exp}\n🔗 ${url}`);
                } catch {
                    results.push(`❌ *${server.name}* (Gagal upload)`);
                } finally {
                    completedCount++;
                    const isDone = completedCount === servers.length;
                    const footer = isDone ? `\n\n✨ *Selesai!*` : `\n\n⏳ _Proses: ${completedCount}/${servers.length}_`;

                    await sock.sendMessage(m.chat, { 
                        text: header + results.join('\n\n') + footer, 
                        edit: key 
                    });
                }
            }

        } catch (err) {
            console.error(err);
            m.reply('Gagal memproses unggahan media.');
        }
    }
};