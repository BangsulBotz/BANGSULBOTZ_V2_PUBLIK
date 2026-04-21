import { prepareWAMessageMedia } from 'baileys';
import { saveThumb } from '../../database/db_thumbnails.js';

export default {
    command: 'savethumb',
    alias: [
        'addthumb', 'sthum', 'addthumbnail', 'savethumbnail', 'st',
        'savethumb2', 'addthumb2', 'setthumbinfo', 'setthumbv2', 'addthumbinfo', 'st2', 'stinfo'
    ],
    description: 'Simpan thumbnail ke database (support type thumbnail & thumbnail-info)',
    help: '`<nama> <url>`',
    onlyOwner: true,
    typing: true,
    wait: true,

    async execute(m, sock, args) {
        const name = args[0];
        const imageUrl = args[1];

        if (!name || !imageUrl) {
            return m.reply(`*Format Salah!*\n\nGunakan: ${m.prefix}${m.command} <nama> <url>\nContoh: ${m.prefix}${m.command} infobot https://telegra.ph/file/xyz.jpg`);
        }

        const isInfoType = m.command === 'savethumb2' ||
            m.command === 'addthumb2' ||
            m.command === 'setthumbinfo' ||
            m.command === 'setthumbv2' ||
            m.command === 'addthumbinfo' ||
            m.command === 'st2' ||
            m.command === 'stinfo';

        const thumbType = isInfoType ? 'thumbnail-info' : 'thumbnail';

        try {
            const WAMC = await prepareWAMessageMedia(
                { image: { url: imageUrl } },
                {
                    upload: sock.waUploadToServer,
                    mediaTypeOverride: "thumbnail-link"
                }
            );


            const { imageMessage: i } = WAMC;

            const thumbData = {
                jpegThumbnail: i.jpegThumbnail ? i.jpegThumbnail.toString('base64') :
                    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAQAAAAnOwc2AAAADElEQVR4nGNgGG4AAADSAAFQmYCvAAAAAElFTkSuQmCC",
                thumbnailDirectPath: i.directPath,
                thumbnailSha256: i.fileSha256 ? i.fileSha256.toString('base64') : "",
                thumbnailEncSha256: i.fileEncSha256 ? i.fileEncSha256.toString('base64') : "",
                mediaKey: i.mediaKey ? i.mediaKey.toString('base64') : "",
                mediaKeyTimestamp: i.mediaKeyTimestamp || Date.now(),
                thumbnailHeight: i.height || 320,
                thumbnailWidth: i.width || 320,
                inviteLinkGroupTypeV2: 0
            };

            saveThumb(name.toLowerCase(), thumbData, thumbType);

            const typeName = isInfoType ? 'thumbnail-info (V2)' : 'thumbnail (acak)';

            await m.reply(`✅ *Berhasil disimpan!*\n\n` +
                `Nama     : *${name}*\n` +
                `Type     : ${typeName}\n` +
                `URL      : ${imageUrl}\n\n` +
                `Gunakan ${isInfoType ? '`getRandomThumbInfo()`' : '`getRandomThumb()`'} untuk memanggilnya.`);

        } catch (err) {
            console.error(err);
            await m.reply('❌ Gagal memproses gambar.\nPastikan URL gambar valid dan bisa diakses publik.');
        }
    }
};