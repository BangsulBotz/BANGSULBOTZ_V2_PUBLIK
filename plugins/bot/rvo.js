import { downloadContentFromMessage } from 'baileys';

export default {
    command: 'rvo',
    alias: ['read', 'readviewonce', 'rvo'],
    description: 'Membuka pesan View Once (Gambar/Video/Audio).',
    help: '`<reply view once>`',
    typing: true,

    async execute(m, sock) {
        try {
            if (!m.quoted) return m.reply('*Format Salah!*\n\nReply pesan View Once lalu gunakan perintah: `.rvo`');

            const type = m.quoted.type;
            const msg = m.quoted.msg;

            if (msg && msg.viewOnce === true) {
                const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const mimetype = msg.mimetype;
                const caption = msg.caption || '';

                let messageContent = {};
                if (mimetype.startsWith('image')) {
                    messageContent = { image: buffer, caption: `*RVO IMAGE SUCCESS*\n\n*Caption:* ${caption}` };
                } else if (mimetype.startsWith('video')) {
                    messageContent = { video: buffer, caption: `*RVO VIDEO SUCCESS*\n\n*Caption:* ${caption}` };
                } else if (mimetype.startsWith('audio')) {
                    messageContent = { 
                        audio: buffer, 
                        mimetype: 'audio/mpeg', 
                        ptt: false 
                    };
                }

                await sock.sendMessage(m.chat, messageContent, { quoted: m });

            } else {
                return m.reply('*Error:* Pesan yang kamu reply bukan View Once!');
            }

        } catch (err) {
            console.error('Error RVO:', err);
            m.reply(`*Terjadi kesalahan:* ${err.message}`);
        }
    }
};