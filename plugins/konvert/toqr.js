import axios from 'axios';

export default {
    command: 'toqr',
    alias: ['qr', 'qrcode', 'toqrcode'],
    description: 'Mengonversi teks menjadi QR Code',
    help: '`<teks>`',
    typing: true,
    async execute(m, sock, args) {
        const text = args.join(' ') || (m.quoted ? m.quoted.text : '');
        if (!text) {
            return m.reply(
                `🚨 *Perintah Salah!*\n\n` +
                `✨ *Konversi ke QR Code:*\n` +
                `Perintah: \`${m.prefix}${m.command} <teks>\`\n` +
                `Contoh: \`${m.prefix}${m.command} Halo apa kabar?\``
            );
        }

        
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(text)}`;
            
            await sock.sendMessage(m.chat, { 
                image: { url: qrUrl }, 
                caption: `✅ *QR Code Berhasil Dibuat*\n\n📝 *Teks:* ${text}` 
            }, { quoted: m });
            
        } catch (err) {
            throw err;
        }
    }
};