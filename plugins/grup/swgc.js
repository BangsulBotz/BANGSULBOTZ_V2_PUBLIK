import { getContentType } from 'baileys'

export default {
    command: 'swgc',
    alias: ['statusgc', 'storygc', 'upgc','swgv'],
    description: 'Upload pesan yang di-reply sebagai story/status di grup ini.',
    help: '`(Reply)`',

    onlyGroup: true,
    onlyAdmin: true,
    typing: true,

    async execute(m, sock) {
        if (!m.quoted) {
            return await m.reply('Reply pesan yang mau dijadikan story/status grup dulu ya!');
        }

        try {
            const ct = getContentType(m.message);
            const quotedRaw = m.message[ct]?.contextInfo?.quotedMessage;

            if (!quotedRaw) {
                return await m.reply('Gagal mengambil data pesan murni. Pastikan kamu me-reply pesan.');
            }
            let temp = {
                groupStatusMessageV2: {
                    message: quotedRaw
                }
            };
            for (let i = 0; i < 5; i++) {
                temp = {
                    groupStatusMessageV2: {
                        message: temp
                    }
                };
            }
            await sock.relayMessage(m.chat, temp, {});

            await m.reply(`✅ Berhasil upload story grup!`);

        } catch (err) {
            console.error('[SWGC ERROR]', err);
            await m.reply('Gagal: ' + err.message);
        }
    }
};