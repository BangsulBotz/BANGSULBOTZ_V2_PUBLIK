const handler = {
    command: 'togif',
    alias: ['togift'],
    description: 'Kirim video sebagai GIF (Playback)',
    help: '`(reply video)`',
    typing: true,
    wait: true,

    async execute(m, sock) {
        if (!m.quoted || !/video/.test(m.quoted.mime)) {
            return m.reply('Balas video yang ingin dijadikan GIF playback.');
        }

        try {
            const buffer = await m.quoted.download();
            const caption = m.quoted.text || m.quoted.caption || '';

            await sock.sendMessage(m.chat, { 
                video: buffer, 
                gifPlayback: true,
                caption: caption
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Gagal memproses video ke GIF.');
        }
    }
};

export default handler;