import { tinyurl, isgd } from '../../lib/scraper.js';

export default {
    command: 'shorturl',
    alias: ['tinyurl', 'shortlink', 'slink'],
    description: 'Memperpendek URL menggunakan TinyURL dan Is.gd.',
    help: '`<url>`',
    typing: true,

    async execute(m, sock, args) {
        const url = args[0] || (m.quoted ? m.quoted.text : '');
        const isUrl = /^(https?:\/\/[^\s]+)$/.test(url);

        if (!url || !isUrl) {
            return m.reply(`Masukkan URL valid yang diawali dengan http:// atau https://`);
        }

        // Contoh pemanggilan terpisah
        const resTiny = await tinyurl(url);
        const resIsgd = await isgd(url);

        if (!resTiny && !resIsgd) return m.reply(`❌ Gagal mendapatkan link dari semua layanan.`);

        let caption = `🔗 *SHORTENED URL*\n\n`;
        if (resTiny) caption += `\`TinyURL\`:\n${resTiny}\n\n`;
        if (resIsgd) caption += `\`Is.gd\`:\n${resIsgd}\n\n`;
        caption += `*Original*: ${url}`;

        await sock.sendMessage(m.chat, {
            text: caption.trim()
        }, { quoted: m });
    }
};