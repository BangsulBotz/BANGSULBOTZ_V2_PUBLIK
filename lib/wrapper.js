import fs from 'fs';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import config from '../settings.js';
import { getThumb } from '../database/db_thumbnails.js';
import { prepareWAMessageMedia, downloadContentFromMessage, generateWAMessageFromContent, generateWAMessageContent, generateWAMessage, proto } from 'baileys';

export async function smsg(sock) {
    if (!sock || sock.sendKentut) return sock;

    // --- [ 1. SEND REACT ] ---
    sock.sendReact = async (jid, emoji, target) => {
        if (!target) return;
        // Jika target adalah ID string, buat objek key manual
        let reactionKey = typeof target === 'string'
            ? { remoteJid: jid, fromMe: false, id: target }
            : target;

        return sock.sendMessage(jid, {
            react: { text: emoji, key: reactionKey }
        });
    };

    // --- [ 2. SEND ALBUM ] ---
    sock.sendAlbum = async (jid, medias, options = {}) => {
        let album = await generateWAMessageFromContent(jid, {
            albumMessage: {
                expectedImageCount: medias.filter(v => v.image).length,
                expectedVideoCount: medias.filter(v => v.video).length,
            }
        }, { quoted: options.quoted });

        await sock.relayMessage(jid, album.message, { messageId: album.key.id });
        for (let media of medias) {
            let msg = await generateWAMessage(jid, media, { upload: sock.waUploadToServer });
            msg.message.messageContextInfo = {
                messageAssociation: { associationType: 1, parentMessageKey: album.key }
            };
            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
        }
        return album;
    };

    // --- [ 3. DOWNLOAD MEDIA ] ---
    sock.downloadMediaMessage = async (message) => {
        let msg = message.msg || message;
        let mime = msg.mimetype || '';
        let messageType = (message.type || mime.split('/')[0]).replace(/Message/gi, '');
        const stream = await downloadContentFromMessage(msg, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    // --- [4. send with thumbnail] ---

    /** 
    1. Paling lengkap (thumbnail + favicon dari URL)
    await sock.sendWithThumbnail(m.chat, {
        text: "Ini menu bot terbaru",
        title: "BangsulBotz Menu",
        body: "Pilih kategori yang diinginkan",
        thumbnailUrl: "https://telegra.ph/file/contoh.jpg",
        faviconUrl: "https://telegra.ph/file/icon kecil.jpg",
        sourceUrl: "https://github.com/BangsulBotz"
    }, m);

    2. Pakai database
    await sock.sendWithThumbnail(m.chat, {
        text: "Selamat datang!",
        title: "Welcome",
        thumbnailName: "mainmenu",
        faviconName: "boticon",
        sourceUrl: "https://chat.whatsapp.com/xxxx"
    }, m);

    */

    
    sock.sendWithThumbnail = async (jid, data = {}, quoted = null, options = {}) => {
        let {
            text = '',
            title = '',
            body = '',
            thumbnailUrl = null,
            thumbnailName = null,
            faviconUrl = null,
            faviconName = null,
            sourceUrl = '',
            renderLargerThumbnail = true,
            previewType = 1,
            ...restData
        } = data;

        if (!sourceUrl) sourceUrl = 'https://github.com';

        let finalText = sourceUrl + '\n' + (text || '');
        const matchedText = sourceUrl;

        const mentionedJid = new Set();

        if (restData?.mentions && Array.isArray(restData.mentions)) {
            restData.mentions.forEach(j => {
                if (j && typeof j === 'string') {
                    mentionedJid.add(j.trim());
                }
            });
        }

        const fullJidRegex = /(\d{8,15})@(s\.whatsapp\.net|lid)/g;
        let match;
        while ((match = fullJidRegex.exec(finalText)) !== null) {
            mentionedJid.add(`${match[1]}@${match[2]}`);
        }

        const atOnlyRegex = /@(\d{8,15})\b/g;
        while ((match = atOnlyRegex.exec(finalText)) !== null) {
            const number = match[1];
            const alreadyHas =
                mentionedJid.has(`${number}@s.whatsapp.net`) ||
                mentionedJid.has(`${number}@lid`);

            if (!alreadyHas) {
                mentionedJid.add(`${number}@lid`);
            }
        }
        finalText = finalText
            .replace(/(\d{8,15})@(s\.whatsapp\.net|lid)/g, '@$1')
            .replace(/@(\d{8,15})\b/g, '@$1');

        const finalMentionedJid = Array.from(mentionedJid);

        let thumbnailData = {};
        let jpegThumbnailBuffer = undefined;

        const fallbackJpeg = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8/5+hnoEIwDiqkL4KA" +
            "A/0E/8fJ9hBAAAAAElFTkSuQmCC",
            'base64'
        );

        if (thumbnailName) {
            const dbThumb = getThumb(thumbnailName.toLowerCase());
            if (dbThumb) {
                jpegThumbnailBuffer = dbThumb.jpegThumbnail
                    ? Buffer.from(dbThumb.jpegThumbnail, 'base64')
                    : fallbackJpeg;

                thumbnailData = {
                    thumbnailDirectPath: dbThumb.thumbnailDirectPath,
                    thumbnailSha256: dbThumb.thumbnailSha256,
                    thumbnailEncSha256: dbThumb.thumbnailEncSha256,
                    mediaKey: dbThumb.mediaKey,
                    mediaKeyTimestamp: dbThumb.mediaKeyTimestamp,
                    thumbnailHeight: dbThumb.thumbnailHeight || 736,
                    thumbnailWidth: dbThumb.thumbnailWidth || 1308,
                    inviteLinkGroupTypeV2: 0
                };
            }
        }

        if (thumbnailUrl) {
            try {
                const { prepareWAMessageMedia } = await import('baileys');
                const WAMC = await prepareWAMessageMedia(
                    { image: { url: thumbnailUrl } },
                    { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
                );

                const i = WAMC.imageMessage || WAMC;
                jpegThumbnailBuffer = i.jpegThumbnail || jpegThumbnailBuffer || fallbackJpeg;

                thumbnailData = {
                    thumbnailDirectPath: i.directPath,
                    thumbnailSha256: i.fileSha256 ? i.fileSha256.toString('base64') : "",
                    thumbnailEncSha256: i.fileEncSha256 ? i.fileEncSha256.toString('base64') : "",
                    mediaKey: i.mediaKey ? i.mediaKey.toString('base64') : "",
                    mediaKeyTimestamp: i.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
                    thumbnailHeight: i.height || 736,
                    thumbnailWidth: i.width || 1308,
                    inviteLinkGroupTypeV2: 0
                };
            } catch (e) {
                console.error('Upload thumbnail gagal:', e);
                jpegThumbnailBuffer = fallbackJpeg;
            }
        }

        if (!jpegThumbnailBuffer) jpegThumbnailBuffer = fallbackJpeg;

        let faviconMMSMetadata = null;

        if (faviconName) {
            const fav = getThumb(faviconName.toLowerCase());
            if (fav?.type === 'favicon' && fav.faviconMMSMetadata) {
                faviconMMSMetadata = fav.faviconMMSMetadata;
            }
        }

        if (faviconUrl && !faviconMMSMetadata) {
            try {
                const { prepareWAMessageMedia } = await import('baileys');
                const WAMC = await prepareWAMessageMedia(
                    { image: { url: faviconUrl } },
                    { upload: sock.waUploadToServer, mediaTypeOverride: "thumbnail-link" }
                );

                const i = WAMC.imageMessage || WAMC;

                faviconMMSMetadata = {
                    thumbnailDirectPath: i.directPath,
                    thumbnailSha256: i.fileSha256 ? i.fileSha256.toString('base64') : "",
                    thumbnailEncSha256: i.fileEncSha256 ? i.fileEncSha256.toString('base64') : "",
                    mediaKey: i.mediaKey ? i.mediaKey.toString('base64') : "",
                    mediaKeyTimestamp: i.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
                    thumbnailHeight: i.height || 48,
                    thumbnailWidth: i.width || 48
                };
            } catch (e) {
                console.error('Upload favicon gagal:', e);
            }
        }

        let contextInfo = {
            mentionedJid: finalMentionedJid.length > 0 ? finalMentionedJid : [],
            groupMentions: [],
            statusAttributions: []
        };

        if (quoted && quoted.key) {
            contextInfo.stanzaId = quoted.key.id;
            contextInfo.participant = quoted.key.participant || quoted.key.remoteJid;
            contextInfo.remoteJid = quoted.key.remoteJid;
            contextInfo.fromMe = quoted.key.fromMe || false;
            contextInfo.quotedMessage = quoted.message || { conversation: "" };
            contextInfo.quotedType = 0;
        }

        if (restData.contextInfo) {
            contextInfo = { ...contextInfo, ...restData.contextInfo };
        }

        const extendedTextMessage = {
            text: finalText,
            matchedText: matchedText,
            title: title || '',
            description: body || '',
            previewType: previewType,
            renderLargerThumbnail: renderLargerThumbnail,
            inviteLinkGroupTypeV2: 0,
            jpegThumbnail: jpegThumbnailBuffer,
            ...thumbnailData,
            ...(faviconMMSMetadata && { faviconMMSMetadata }),
            contextInfo: contextInfo,
            ...restData
        };

        const content = {
            extendedTextMessage: extendedTextMessage,
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32)
            }
        };

        return await sock.relayMessage(jid, content, { quoted, ...options });
    };

    // --- [5. upload to server]---
    // cara pakai : sock.uploadToThumbnail ("https://contoh.jpg")
    sock.uploadToThumbnail = async (imageUrl) => {
        try {
            const { prepareWAMessageMedia } = await import('baileys');

            const WAMC = await prepareWAMessageMedia(
                { image: { url: imageUrl } },
                {
                    upload: sock.waUploadToServer,
                    mediaTypeOverride: "thumbnail-link"
                }
            );

            const i = WAMC.imageMessage || WAMC;

            return {
                thumbnailDirectPath: i.directPath,
                thumbnailSha256: i.fileSha256 ? i.fileSha256.toString('base64') : "",
                thumbnailEncSha256: i.fileEncSha256 ? i.fileEncSha256.toString('base64') : "",
                mediaKey: i.mediaKey ? i.mediaKey.toString('base64') : "",
                mediaKeyTimestamp: i.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
                thumbnailHeight: i.height || 48,
                thumbnailWidth: i.width || 48
            };
        } catch (err) {
            console.error('Upload to thumbnail failed:', err.message);
            return null;
        }
    };

    // Penanda agar tidak di-inject dua kali
    sock.sendKentut = true;

    return sock;
}
