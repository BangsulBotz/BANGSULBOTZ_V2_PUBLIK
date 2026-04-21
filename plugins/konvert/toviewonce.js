export default {
    command: 'toviewonce',
    alias: ['toonce', 'tovon'],
    description: 'Mengubah media menjadi pesan sekali lihat',
    help: '`<reply media>`',
    typing: true,

    async execute(m, sock) {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image|video|audio/.test(mime)) {
            return m.reply(`Balas gambar, video, atau audio dengan perintah *${m.prefix}${m.command}*`);
        }

        try {
            const media = await sock.downloadMediaMessage(quoted);
            const isImage = mime.includes('image');
            const isVideo = mime.includes('video');
            const isAudio = mime.includes('audio');

            let messageContent = { viewOnce: true };

            if (isImage) {
                messageContent.image = media;
                messageContent.caption = quoted.text || '';
            } else if (isVideo) {
                messageContent.video = media;
                messageContent.caption = quoted.text || '';
            } else if (isAudio) {
                messageContent.audio = media;
                messageContent.mimetype = 'audio/mp4';
            }

            await sock.sendMessage(m.chat, messageContent, { quoted: m });
        } catch (err) {
            throw err;
        }
    }
};