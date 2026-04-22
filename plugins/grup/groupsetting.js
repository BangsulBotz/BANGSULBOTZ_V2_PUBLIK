import config from '../../settings.js';
import { getGroupSetting } from '../../database/db_group.js'; 

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

            let statusGroupText = `${config.sourceUrl}\n⚙️ *PENGATURAN GRUP*\n`;
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

            await sock.sendWithThumbnail(msg.chat, {
                text: statusGroupText,
                title: `GROUP CONFIGURATION`,
                body: msg.groupMetadata?.subject || config.botName,
                thumbnailName: config.randomThumbnail,
                faviconName: config.randomFavicon,
                sourceUrl: config.sourceUrl,
                renderLargerThumbnail: true,
                mentions: [msg.sender]
            }, msg);

        } catch (err) {
            console.error('Error GroupSettings:', err);
            await msg.reply('❌ Gagal mengambil data dari database SQLite.');
        }
    }
};
