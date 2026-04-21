import axios from 'axios';

export default {
    command: 'inspect',
    alias: ['cekgrup', 'ginfo'],
    description: 'Melihat detail informasi grup dari link undangan.',
    help: '`<link grup>`',

    typing: true,

    async execute(m, sock, args) {
        const text = args[0] || (m.quoted ? m.quoted.text : '');
        const inviteCode = text?.match(/chat.whatsapp.com\/([\w\d]*)/)?.[1];

        if (!inviteCode) return m.reply(`Masukkan link grup WhatsApp yang valid!`);

        try {
            const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
            const groupId = inviteInfo.id;

            let groupData = inviteInfo;
            let isFullData = false;

            try {
                const fullMetadata = await sock.groupMetadata(groupId);
                if (fullMetadata) {
                    groupData = fullMetadata;
                    isFullData = true;
                }
            } catch {
                isFullData = false;
            }

            const { subject, owner, creation, desc, participants, size, announce } = groupData;

            const adminCount = participants.filter(p => p.admin !== null && p.admin !== undefined).length;
            const memberCount = (isFullData ? size : groupData.size) - adminCount;
            const creationDate = new Date(creation * 1000).toLocaleString('id-ID', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
            });

            let ppUrl;
            try {
                ppUrl = await sock.profilePictureUrl(groupId, 'image');
            } catch {
                ppUrl = 'https://telegra.ph/file/241d714131f4565696d5e.jpg';
            }

            const caption = `📊 *INSPECTOR REPORT* 📊\n${isFullData ? '✅ _Status: Bot sudah di dalam grup (Data Akurat)_' : '⚠️ _Status: Bot di luar grup (Data Terbatas)_'}\n\n` +
                `📝 *Nama*: ${subject}\n` +
                `🆔 *ID*: ${groupId}\n` +
                `📅 *Dibuat*: ${creationDate}\n` +
                `👤 *Owner*: ${owner ? '@' + owner.split('@')[0] : '-'}\n\n` +
                `👥 *Statistik Member*:\n` +
                `┌  Total: ${isFullData ? size : groupData.size}\n` +
                `├  Admin: ${adminCount}\n` +
                `└  User: ${memberCount}\n\n` +
                `🔐 *Privasi*: ${announce ? '🔒 Tertutup' : '🌍 Terbuka'}\n` +
                `📜 *Deskripsi*:\n${desc || '-'}\n\n` +
                `🔗 *Link*: https://chat.whatsapp.com/${inviteCode}`;

            await sock.sendMessage(m.chat, {
                text: caption,
                contextInfo: {
                    externalAdReply: {
                        title: `Group Inspector: ${subject}`,
                        body: `Created at ${creationDate}`,
                        thumbnailUrl: ppUrl,
                        sourceUrl: `https://chat.whatsapp.com/${inviteCode}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    },
                    mentionedJid: [owner].filter(Boolean)
                }
            }, { quoted: m });

        } catch (err) {
            if (err?.data === 406) return m.reply('❌ Grup tidak ditemukan.');
            if (err?.data === 410) return m.reply('❌ Link grup telah direset.');
            m.reply(`❌ Error: ${err.message}`);
        }
    }
};