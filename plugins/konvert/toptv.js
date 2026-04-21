import { generateWAMessageContent } from 'baileys';

export default {
    command: 'toptv',
    alias: ['ptv'],
    description: 'Ubah video menjadi pesan video bulat (PTV)',
    help: '`(reply video)`',
    typing: true,
    wait: true,

    async execute(m, sock) {
        const quoted = m.quoted ? m.quoted : m;
        if (!/video/.test(quoted.mime)) {
            return m.reply('Balas video yang ingin diubah menjadi PTV.');
        }

        try {
            const buffer = await quoted.download();
            
            const message = await generateWAMessageContent(
                { video: buffer },
                { upload: sock.waUploadToServer }
            );

            await sock.relayMessage(m.chat, {
                ptvMessage: message.videoMessage
            }, {});

        } catch (e) {
            console.error(e);
            m.reply('Gagal mengonversi ke PTV.');
        }
    }
};