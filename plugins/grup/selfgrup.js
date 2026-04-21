import { getGroupSetting, setGroupSetting } from '../../database/db_group.js'; 
import { getThumbInfo } from '../../database/db_thumbnails.js'; 

export default {
    command: "selfgc",
    alias: ["selfgrup", "selfgroup", "mutegc"],
    onlyOwner: true,
    onlyGroup: true,
    help: '`<on/off>`',
    description: 'Mengatur mode Self di grup (hanya owner yang bisa pakai command)',

    async execute(m, sock, args) {
        try {
            const current = getGroupSetting(m.chat, 'self');

            if (!args[0]) {
                const status = current ? "AKTIF (hanya owner)" : "NON-AKTIF (semua bisa)";
                
                let text = `https://github.com/BangsulBotz\nSelf mode di grup ini: *${status}*\n\n` +
                    `Gunakan:\n` +
                    `${m.prefix}${m.command} \`on\`\n> hanya owner bisa command di grup ini\n` +
                    `${m.prefix}${m.command} \`off\`\n> semua bisa command`;
                const thumbKey = current ? 'selfgc' : 'grupunself';
                const thumbData = getThumbInfo(thumbKey);

                const extendedText = {
                    text: text,
                    matchedText: "https://github.com/BangsulBotz",
                    title: `SELF MODE`,
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
                            mentionedJid: [m.sender],
                            groupMentions: [],
                            statusAttributions: [],
                            stanzaId: m.key?.id || "",
                            participant: m.key?.participant || m.sender,
                            quotedMessage: {
                                conversation: m.body || "selfgc"
                            },
                            quotedType: 0
                        }
                    },
                    messageContextInfo: {
                        threadId: [],
                        messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                    }
                };

                return await sock.relayMessage(m.chat, content, { quoted: m });
            }

            // ===== SET ON / OFF =====
            const input = args[0].toLowerCase();
            let target;

            if (["on", "aktif", "1"].includes(input)) target = true;
            else if (["off", "mati", "0"].includes(input)) target = false;
            else return await m.reply("Gunakan: `on` atau `off`");

            setGroupSetting(m.chat, 'self', target);

            const finalStatus = target ? "AKTIF (hanya owner)" : "NON-AKTIF";

            let text = `https://github.com/BangsulBotz\nSelf mode grup ini sekarang: *${finalStatus}* ✓`;

            const thumbKey = target ? 'selfgc' : 'grupunself';
            const thumbData = getThumbInfo(thumbKey);

            const extendedText = {
                text: text,
                matchedText: "https://github.com/BangsulBotz",
                title: `SELF MODE UPDATED`,
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
                        mentionedJid: [m.sender],
                        groupMentions: [],
                        statusAttributions: [],
                        stanzaId: m.key?.id || "",
                        participant: m.key?.participant || m.sender,
                        quotedMessage: {
                            conversation: m.body || "selfgc"
                        },
                        quotedType: 0
                    }
                },
                messageContextInfo: {
                    threadId: [],
                    messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                }
            };

            return await sock.relayMessage(m.chat, content, { quoted: m });

        } catch (err) {
            console.error('Error SelfGC:', err);
            await m.reply('❌ Terjadi kesalahan saat mengatur self mode.');
        }
    }
};