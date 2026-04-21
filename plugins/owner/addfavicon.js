import { proto, getContentType, normalizeMessageContent } from 'baileys';
import { getRawMessageById } from '../../database/db_raw_messages.js';
import { saveThumb } from '../../database/db_thumbnails.js';

export default {
    command: 'addfavicon',
    alias: ['saveicon', 'savefavicon', 'addicon', 'savethumbnailicon'],
    description: 'Simpan favicon dari reply pesan atau dari URL',
    help: '`<nama> <url>`',
    onlyOwner: true,
    typing: true,

    async execute(m, sock, args) {
        const name = args[0];
        if (!name) {
            return await m.reply(`*Format Salah!*\n\nGunakan: ${m.prefix}${m.command} <nama>\nContoh: ${m.prefix}${m.command} youtube`);
        }

        let faviconData = null;

        // Dari URL
        if (args[1]) {
            const imageUrl = args[1];
            faviconData = await sock.uploadToThumbnail(imageUrl);

            if (!faviconData) {
                return await m.reply('❌ Gagal mengupload gambar dari URL.');
            }
        } 
        else if (m.quoted) {
            try {
                const messageId = m.quoted.key.id;
                let rawMessageObj = getRawMessageById(messageId)?.rawObj || m.quoted.message || {};

                const normalized = normalizeMessageContent(rawMessageObj.message || rawMessageObj);
                const message = proto.Message.fromObject(normalized);

                if (message.extendedTextMessage?.faviconMMSMetadata) {
                    faviconData = message.extendedTextMessage.faviconMMSMetadata;
                } else if (message.extendedTextMessage?.contextInfo?.externalAdReply?.faviconMMSMetadata) {
                    faviconData = message.extendedTextMessage.contextInfo.externalAdReply.faviconMMSMetadata;
                }
            } catch (err) {
                return await m.reply('❌ Gagal membaca data dari pesan yang direply.');
            }
        } 
        else {
            return await m.reply(`❌ Reply pesan atau gunakan: ${m.prefix}${m.command} <nama> <url>`);
        }

        if (!faviconData) {
            return await m.reply(`❌ Tidak ditemukan data favicon.`);
        }

        const safeFavicon = {
            thumbnailDirectPath: faviconData.thumbnailDirectPath,
            thumbnailSha256: Buffer.isBuffer(faviconData.thumbnailSha256) 
                ? faviconData.thumbnailSha256.toString('base64') 
                : faviconData.thumbnailSha256,
            thumbnailEncSha256: Buffer.isBuffer(faviconData.thumbnailEncSha256) 
                ? faviconData.thumbnailEncSha256.toString('base64') 
                : faviconData.thumbnailEncSha256,
            mediaKey: Buffer.isBuffer(faviconData.mediaKey) 
                ? faviconData.mediaKey.toString('base64') 
                : faviconData.mediaKey,
            mediaKeyTimestamp: typeof faviconData.mediaKeyTimestamp === 'object' && faviconData.mediaKeyTimestamp?.low !== undefined
                ? Number(faviconData.mediaKeyTimestamp.low)
                : faviconData.mediaKeyTimestamp,
            thumbnailHeight: faviconData.thumbnailHeight || 48,
            thumbnailWidth: faviconData.thumbnailWidth || 48
        };

        const thumbData = {
            type: "favicon",
            faviconMMSMetadata: safeFavicon,
            createdFrom: m.quoted ? getContentType(m.quoted.message) || "extendedTextMessage" : "url",
            savedAt: Date.now()
        };

        saveThumb(name.toLowerCase(), thumbData, 'favicon');

        await m.reply(`✅ *Berhasil!* Favicon dengan nama *"${name}"* telah disimpan.`);
    }
};