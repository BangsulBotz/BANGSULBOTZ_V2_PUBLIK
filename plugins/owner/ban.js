import { blacklist, getUserData, normalizeJid } from '../../database/db_user.js';
import { getThumbInfo } from '../../database/db_thumbnails.js';

export default {
    command: 'ban',
    alias: ['banned', 'bc', 'blacklist'],
    help: '`(reply/tag)`',
    onlyOwner: true,

    async execute(m, sock, args) {
        let rawId = m.quoted ? m.quoted.sender : (m.mentions?.[0] || (args[0] ? normalizeJid(args[0]) : null));
        if (!rawId) return m.reply("Tag atau reply orang yang mau di-ban!");

        const row = getUserData(rawId);
        const finalJid = row?.jid || (rawId.endsWith('@s.whatsapp.net') ? rawId : null);
        const finalLid = row?.lid || (rawId.endsWith('@lid') ? rawId : null);
        const name = row?.name || 'User';
        const reason = args.join(' ').replace(/@\d+/g, '').trim() || 'Tanpa alasan';

        if (!finalJid && !finalLid) {
            return m.reply("Jancok, user ini gak ada di database! Suruh dia chat dulu.");
        }

        const toBan = finalJid || finalLid;
        blacklist.add(toBan, reason);

        let response = `https://github.com/BangsulBotz\n*── 「 BAN SUCCESS 」 ──*\n\n`;
        response += `◦ *User:* ${name}\n`;
        response += `◦ *PN:* ${finalJid ? finalJid.split('@')[0] : '-'}\n`;
        response += `◦ *JID:* ${finalJid || '-'}\n`;
        response += `◦ *LID:* ${finalLid || '-'}\n`;
        response += `◦ *Alasan:* \`${reason}\`\n`;
        response += `◦ *Status:* Terblokir dari sistem ✅\n`;
        response += `──────────────────────────────`;

        const thumbData = getThumbInfo('block');

        const extendedText = {
            text: response,
            matchedText: "https://github.com/BangsulBotz",
            title: `SISTEM BLACKLIST`,
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
                        conversation: m.body || "ban"
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
    }
};