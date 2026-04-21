import config from '../../settings.js';

export default {
    command: 'setppbot',
    alias: ['ubahppbot', 'setpp'],
    description: 'Mengubah foto profil bot (Reply gambar).',
    help: '`(caption/reply)`',
    onlyOwner: true,
    typing: true,
    async execute(m, sock, args) {
        try {
            const quoted = m.quoted ? m.quoted : m;
            if (!/image/.test(quoted.mime)) {
                return m.reply(`*Format Salah!* Reply gambar dengan caption: \`${m.prefix}${m.command}\``);
            }

            const buffer = await sock.downloadMediaMessage(quoted);
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.updateProfilePicture(botNumber, buffer);
            await sock.sendMessage(m.chat, {
                text: '✅ *Success!* Foto profil bot telah diperbarui.',
                contextInfo: {
                    externalAdReply: {
                        title: 'Profile System Update',
                        body: 'Bot profile picture has been changed',
                        thumbnailUrl: config.thumbnail,
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m });

        } catch (err) {
            console.error('Error SetPPBot:', err);
            m.reply('❌ Gagal memperbarui foto profil. Pastikan gambar tidak terlalu besar.');
        }
    }
};