import { getGroupSetting } from '../../database/db_group.js'; 
import { getThumbInfo } from '../../database/db_thumbnails.js'; 

export default {
    command: 'grupsetting',
    alias: ['groupsetting', 'grupset', 'grupsettings', 'groupset'],
    description: 'Menampilkan konfigurasi fitur grup saat ini dari database SQLite.',
    onlyGroup: true,
    typing: true,

    async execute(msg, sock) {
        try {
            const chatJid = msg.chat;

            const featureKeys = [
                'self', 'setinfo', 'autogemini', 'welcome', 
                'antidelete', 'antilinkall', 'antisticker', 
                'antilinkgc', 'antibot', 'antitagsw',  
                'antitagall', 'antiswgc'
            ];

            let statusGroupText = `https://github.com/BangsulBotz\n⚙️ *PENGATURAN GRUP*\n`;
            statusGroupText += `*Grup:* ${msg.groupMetadata?.subject || 'WhatsApp Group'}\n`;
            statusGroupText += `*JID:* ${chatJid}\n`;
            statusGroupText += `──────────────────\n\n`;

            let securityText = `🛡️ *FITUR KEAMANAN (SANKSI)*\n`;
            let onOffText = `⚙️ *FITUR ON/OFF*\n`;

            for (const key of featureKeys) {
                const value = getGroupSetting(chatJid, key);

                if (typeof value === 'object' && value !== null) {
                    const delStatus = value.delete ? '✅' : '❌';
                    const kickStatus = value.kick ? '✅' : '❌';
                    
                    securityText += `\`${key}\`\n`;
                    securityText += `> [${delStatus} delete] [${kickStatus} kick]\n\n`;
                } else {
                    const icon = value ? '✅' : '❌';
                    const label = value ? 'Aktif' : 'Non-Aktif';
                    onOffText += `\`${key}\` : ${icon} ${label}\n`;
                }
            }

            statusGroupText += securityText + onOffText;
            statusGroupText += `\n──────────────────\n`;
            statusGroupText += `*Ubah:* \`${msg.prefix}antilinkall on kick\``;

            const thumbData = getThumbInfo('grupset');

            const extendedText = {
                text: statusGroupText,
                matchedText: "https://github.com/BangsulBotz",
                title: `GROUP CONFIGURATION`,
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
                extendedText.thumbnailHeight     = thumbData.thumbnailHeight;
                extendedText.thumbnailWidth      = thumbData.thumbnailWidth;
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
                            conversation: msg.body || "grupsetting"
                        },
                        quotedType: 0
                    }
                },
                messageContextInfo: {
                    threadId: [],
                    messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                }
            };

            await sock.relayMessage(chatJid, content, { quoted: msg });

        } catch (err) {
            console.error('Error GroupSettings:', err);
            await msg.reply('❌ Gagal mengambil data dari database SQLite.');
        }
    }
};