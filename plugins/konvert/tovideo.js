import { downloadContentFromMessage } from 'baileys';

export default {
    command: 'tovideo',
    alias: ['tovid', 'doc2mp4','doc2vid','doc2video','2vid','2video'],
    description: 'Mengonversi video document menjadi video biasa yang bisa diputar.',
    help: '`<reply document>`',
    wait: true,

    async execute(m, sock) {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/video|document/.test(mime)) return m.reply(`Reply atau kirim video dalam bentuk document dengan caption *${m.prefix}${m.command}*`);

        try {
            const messageType = quoted.type.replace('Message', '');
            const stream = await downloadContentFromMessage(quoted.msg || quoted, messageType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            await sock.sendMessage(m.chat, { 
                video: buffer, 
                caption: ``,
                mimetype: 'video/mp4'
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            m.reply('Gagal mengonversi media. Pastikan file yang dikirim adalah video.');
        }
    }
};