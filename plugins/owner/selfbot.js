import { getThumbInfo } from '../../database/db_thumbnails.js'; 

export default {
    command: 'self',
    alias: ['selfbot', 'modebot'],
    description: 'Mengatur bot agar hanya merespon owner (Self Mode).',
    help: '`<on/off>`',
    onlyOwner: true,
    typing: true,

    async execute(msg, sock, args) {
        try {
            const arg = args[0]?.toLowerCase();
            const cmd = `${msg.prefix}${msg.command}`;

            if (!arg) {
                const isSelf = global.botDb.botSettings.self;
                const status = isSelf ? '✅ AKTIF (Private)' : '❌ MATI (Public)';

                let text = `https://github.com/BangsulBotz\n` +
                           `Status Self-Mode: ${status}\n\n` +
                           `Ketik \`${cmd} on/off\` untuk mengubah mode.`;

                const thumbKey = isSelf ? 'botself' : 'botunself';
                const thumbData = getThumbInfo(thumbKey);

                const extendedText = {
                    text: text,
                    matchedText: "https://github.com/BangsulBotz",
                    title: `BOT SELF MODE`,
                    previewType: 1,
                    inviteLinkGroupTypeV2: 0,
                };

                if (thumbData) {
                    extendedText.jpegThumbnail       = thumbData.jpegThumbnail;
                    extendedText.thumbnailDirectPath = thumbData.thumbnailDirectPath;
                    extendedText.thumbnailSha256     = thumbData.thumbnailSha256;
                    extendedText.thumbnailEncSha256  = thumbData.thumbnailEncSha256;
                    extendedText.mediaKey            = thumbData.mediaKey;
                    extendedText.mediaKeyTimestamp   = thumbData.mediaKeyTimestamp;
                    extendedText.thumbnailHeight     = thumbData.thumbnailHeight || 320;
                    extendedText.thumbnailWidth      = thumbData.thumbnailWidth || 320;
                }

                const content = {
                    extendedTextMessage: {
                        ...extendedText,
                        contextInfo: {
                            mentionedJid: [msg.sender],
                            groupMentions: [],
                            statusAttributions: [],
                            stanzaId: msg.key?.id || "",
                            participant: msg.key?.participant || msg.sender,
                            quotedMessage: {
                                conversation: msg.body || "self"
                            },
                            quotedType: 0
                        }
                    },
                    messageContextInfo: {
                        threadId: [],
                        messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                    }
                };

                return await sock.relayMessage(msg.chat, content, { quoted: msg });
            }

            let newValue;
            if (['on', 'aktif', '1'].includes(arg)) newValue = true;
            else if (['off', 'mati', '0'].includes(arg)) newValue = false;
            else return msg.reply('Gunakan: `on` atau `off`');

            global.botDb.botSettings.self = newValue;
            global.saveBotDb();

            const finalStatus = newValue ? '✅ AKTIF' : '❌ MATI';

            let text = `https://github.com/BangsulBotz\n` +
                       `Self-Mode berhasil diubah menjadi: ${finalStatus} ✓`;

            const thumbKey = newValue ? 'botself' : 'botunself';
            const thumbData = getThumbInfo(thumbKey);

            const extendedText = {
                text: text,
                matchedText: "https://github.com/BangsulBotz",
                title: `BOT MODE UPDATED`,
                previewType: 1,
                inviteLinkGroupTypeV2: 0,
            };

            if (thumbData) {
                extendedText.jpegThumbnail       = thumbData.jpegThumbnail;
                extendedText.thumbnailDirectPath = thumbData.thumbnailDirectPath;
                extendedText.thumbnailSha256     = thumbData.thumbnailSha256;
                extendedText.thumbnailEncSha256  = thumbData.thumbnailEncSha256;
                extendedText.mediaKey            = thumbData.mediaKey;
                extendedText.mediaKeyTimestamp   = thumbData.mediaKeyTimestamp;
                extendedText.thumbnailHeight     = thumbData.thumbnailHeight || 320;
                extendedText.thumbnailWidth      = thumbData.thumbnailWidth || 320;
            }

            const content = {
                extendedTextMessage: {
                    ...extendedText,
                    contextInfo: {
                        mentionedJid: [msg.sender],
                        groupMentions: [],
                        statusAttributions: [],
                        stanzaId: msg.key?.id || "",
                        participant: msg.key?.participant || msg.sender,
                        quotedMessage: {
                            conversation: msg.body || "self"
                        },
                        quotedType: 0
                    }
                },
                messageContextInfo: {
                    threadId: [],
                    messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                }
            };

            return await sock.relayMessage(msg.chat, content, { quoted: msg });

        } catch (err) {
            console.error('Error Self Mode:', err);
            await msg.reply('❌ Terjadi kesalahan saat mengubah self mode.');
        }
    }
};