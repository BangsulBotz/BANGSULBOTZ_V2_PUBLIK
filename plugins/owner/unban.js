import { blacklist, getUserData, normalizeJid, db } from '../../database/db_user.js';
import { getThumbInfo } from '../../database/db_thumbnails.js';

export default {
    command: 'unban',
    alias: ['unblacklist', 'unbanned'],
    help: '`(reply/tag)`',
    onlyOwner: true,

    async execute(msg, sock, args) {
        let targetId = msg.quoted ? msg.quoted.sender : (msg.mentions?.[0] || (args[0] ? normalizeJid(args[0]) : null));
        if (!targetId) return msg.reply("Tag atau reply orang yang nak di-unban!");

        const row = getUserData(targetId);
        const finalPn = row?.jid || (targetId.endsWith('@s.whatsapp.net') ? targetId : null);
        const finalLid = row?.lid || (targetId.endsWith('@lid') ? targetId : null);

        const checkTarget = finalPn || finalLid || targetId;
        const isBanned = db.prepare("SELECT status FROM users WHERE (jid = ? OR lid = ?) AND status = 'blacklisted'").get(checkTarget, checkTarget);

        if (!isBanned) {
            return msg.reply("User tersebut tidak sedang dalam daftar blokir/banned.");
        }

        if (typeof global.botDb.blacklist === 'object') {
            if (finalPn) delete global.botDb.blacklist[finalPn];
            if (finalLid) delete global.botDb.blacklist[finalLid];
            delete global.botDb.blacklist[targetId];
            global.saveBotDb();
        }

        if (finalPn) blacklist.remove(finalPn);
        if (finalLid) blacklist.remove(finalLid);
        if (targetId && !row) blacklist.remove(targetId);

        const name = row?.name || 'User';
        const responseText = `https://github.com/BangsulBotz\n*── 「 UNBAN SUCCESS 」 ──*\n\n` +
            `◦ *User:* ${name}\n` +
            `◦ *JID:* ${finalPn || '-'}\n` +
            `◦ *LID:* ${finalLid || '-'}\n` +
            `◦ *Status:* Berhasil mencabut user dari blacklist ✅`;

        const thumbData = getThumbInfo('unblock');

        const extendedText = {
            text: responseText,
            matchedText: "https://github.com/BangsulBotz",
            title: `SISTEM UNBLACKLIST`,
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
                        conversation: msg.body || "unban"
                    },
                    quotedType: 0
                }
            },
            messageContextInfo: {
                threadId: [],
                messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
            }
        };

        await sock.relayMessage(msg.chat, content, { quoted: msg });
    }
};