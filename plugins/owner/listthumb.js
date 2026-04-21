import { listThumbs, getThumb, getRandomThumb, getRandomFavicon } from '../../database/db_thumbnails.js';

export default {
    command: 'listthumb',
    alias: ['listthumbnail', 'thumblist', 'lt','listicon', 'listfav', 'faviconlist', 'iconlist'],
    description: 'Menampilkan daftar semua thumbnail yang tersimpan (dipisah per tipe)',
    onlyOwner: true,
    typing: true,

    async execute(m, sock) {
        try {
            const allItems = listThumbs();

            if (allItems.length === 0) {
                return await m.reply('❌ Belum ada thumbnail yang disimpan di database.');
            }

            let normalThumbs = []; 
            let infoThumbs = [];  
            let faviconThumbs = []; 

            allItems.forEach(item => {
                const data = getThumb(item.name);
                if (!data) return;

                if (data.type === 'favicon' || item.name.toLowerCase().includes('favicon')) {
                    faviconThumbs.push(item.name);
                } 
                else if (data.type === 'thumbnail') {
                    normalThumbs.push(item.name);
                } 
                else if (data.jpegThumbnail || data.thumbnailDirectPath || data.mediaKey) {
                    infoThumbs.push(item.name);
                } 
                else {
                    normalThumbs.push(item.name); 
                }
            });

            // Urutkan alfabetis
            normalThumbs.sort();
            infoThumbs.sort();
            faviconThumbs.sort();

            let text = `https://github.com/BangsulBotz\n`;
            text += `*📋 DAFTAR THUMBNAIL*\n\n`;

            // Type Thumbnail (Biasa)
            if (normalThumbs.length > 0) {
                text += `🔸 *Type Thumbnail*\n`;
                normalThumbs.forEach((name, i) => {
                    text += `${i + 1}. \`${name}\`\n`;
                });
                text += `\n`;
            }

            // Type Thumbnail-info
            if (infoThumbs.length > 0) {
                text += `🔹 *Type Thumbnail-info (V2)*\n`;
                infoThumbs.forEach((name, i) => {
                    text += `${i + 1}. \`${name}\`\n`;
                });
                text += `\n`;
            }

            // Type Favicon
            if (faviconThumbs.length > 0) {
                text += `⭐ *Type Favicon*\n`;
                faviconThumbs.forEach((name, i) => {
                    text += `${i + 1}. \`${name}\`\n`;
                });
                text += `\n`;
            }

            text += `──────────────────\n`;
            text += `Total: ${allItems.length} thumbnail\n`;
            text += `Thumbnail     : ${normalThumbs.length}\n`;
            text += `Thumbnail-info: ${infoThumbs.length}\n`;
            text += `Favicon       : ${faviconThumbs.length}`;

            const randomThumb = getRandomThumb();
            const randomFav = getRandomFavicon();

            const extendedText = {
                text: text,
                matchedText: "https://github.com/BangsulBotz",
                title: `THUMBNAIL LIST`,
                previewType: 1,
                inviteLinkGroupTypeV2: 0,
            };

            if (randomThumb) {
                extendedText.jpegThumbnail       = randomThumb.jpegThumbnail;
                extendedText.thumbnailDirectPath = randomThumb.thumbnailDirectPath;
                extendedText.thumbnailSha256     = randomThumb.thumbnailSha256;
                extendedText.thumbnailEncSha256  = randomThumb.thumbnailEncSha256;
                extendedText.mediaKey            = randomThumb.mediaKey;
                extendedText.mediaKeyTimestamp   = randomThumb.mediaKeyTimestamp;
                extendedText.thumbnailHeight     = randomThumb.thumbnailHeight || 320;
                extendedText.thumbnailWidth      = randomThumb.thumbnailWidth || 320;
            }

            if (randomFav && randomFav.faviconMMSMetadata) {
                extendedText.faviconMMSMetadata = randomFav.faviconMMSMetadata;
            }

            const content = {
                extendedTextMessage: {
                    ...extendedText,
                    contextInfo: {
                        mentionedJid: [m.sender],
                        groupMentions: [],
                        statusAttributions: [],
                        stanzaId: m.key?.id || "",
                        participant: m.key?.participant || m.sender,
                        quotedMessage: {
                            conversation: m.body || "listthumb"
                        },
                        quotedType: 0
                    }
                },
                messageContextInfo: {
                    threadId: [],
                    messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                }
            };

            await sock.relayMessage(m.chat, content, { quoted: m });

        } catch (err) {
            console.error('Error ListThumb:', err);
            await m.reply('❌ Terjadi kesalahan saat mengambil daftar thumbnail.');
        }
    }
};