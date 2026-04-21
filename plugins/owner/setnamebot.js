export default {
    command: 'setnamebot',
    alias: ['setbotname'],
    description: 'Mengubah nama profil WhatsApp bot.',
    help: '`<teks>/(reply)`',
    onlyOwner: true,
    typing: true,
    execute: async (msg, sock, args) => {
        try {
            let newName;
            
            if (msg.quoted && (msg.quoted.text || msg.quoted.body)) {
                newName = msg.quoted.text || msg.quoted.body;
            } else if (args.length > 0) {
                newName = args.join(' ');
            }

            if (!newName) {
                return msg.reply(`Format salah!\n\nGunakan: \`${msg.prefix}${msg.command} <nama>\`\nAtau reply pesan teks dengan perintah \`${msg.prefix}${msg.command}\``);
            }

            if (newName.length > 25) {
                return msg.reply('Gagal! Nama maksimal 25 karakter.');
            }

            await sock.updateProfileName(newName);

            await sock.sendMessage(msg.chat, {
                text: `*✅ BERHASIL*\n\nNama profil bot telah diubah menjadi:\n*${newName}*`,
            }, { quoted: msg });

        } catch (err) {
            console.error(err);
            return msg.reply('Terjadi kesalahan saat mencoba mengubah nama profil.');
        }
    }
};