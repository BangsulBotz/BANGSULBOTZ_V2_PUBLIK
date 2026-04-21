import { db } from '../../database/db_user.js';
import { getThumbInfo } from '../../database/db_thumbnails.js';

export default {
    command: 'listban',
    alias: ['banlist', 'listblacklist'],
    onlyOwner: true,

    async execute(msg, sock, args) {
        const bannedUsers = db.prepare(`
            SELECT jid, name, lid, reason, action_time 
            FROM users 
            WHERE status = 'blacklisted' 
            ORDER BY action_time DESC
        `).all();

        if (!bannedUsers || bannedUsers.length === 0) {
            return msg.reply("Sistem bersih. Tidak ada user yang terdaftar dalam blacklist saat ini.");
        }

        let txt = `https://github.com/BangsulBotz\n*── 「 BLACKLISTED USERS 」 ──*\n\n`;
        let i = 1;

        for (let user of bannedUsers) {
            const pn = user.jid && user.jid.endsWith('@s.whatsapp.net') 
                ? user.jid.split('@')[0] 
                : '-';

            txt += `${i++}. *${user.name || 'Unknown'}*\n`;
            txt += `◦ PN: ${pn}\n`;
            txt += `◦ JID: ${user.jid || '-'}\n`;
            txt += `◦ LID: ${user.lid || '-'}\n`;
            txt += `◦ Alasan: ${user.reason || 'Tanpa alasan'}\n`;
            
            if (user.action_time) {
                const date = new Date(user.action_time).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                txt += `◦ Sejak: ${date} WIB\n`;
            }
            txt += `──────────────────\n\n`;
        }

        const thumbData = getThumbInfo('block');

        const extendedText = {
            text: txt.trim(),
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
                    mentionedJid: [msg.sender],
                    groupMentions: [],
                    statusAttributions: [],
                    stanzaId: msg.key?.id || "",
                    participant: msg.key?.participant || msg.sender,
                    quotedMessage: {
                        conversation: msg.body || "listban"
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