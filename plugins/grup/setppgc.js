export default {
    command: 'setppgc',
    alias: ['setppgroup','setppgrup'],
    description: `Mengubah foto profil grup secara standar (persegi).

*Cara Penggunaan:*
- Kirim/Reply gambar dengan caption .setppgc

*Syarat:*
- Harus berupa gambar (bukan sticker).
- Bot harus menjadi admin grup.`,
    help:'`(reply img)`',
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock) => {
        try {
            const quoted = msg.quoted ? msg.quoted : msg;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image/.test(mime) || /webp/.test(mime)) {
                return msg.reply('❌ Format salah! Silakan reply atau kirim gambar (bukan sticker) dengan perintah .setppgc');
            }

            const imageBuffer = await quoted.download();
            if (!imageBuffer) {
                return msg.reply('❌ Gagal mengunduh gambar. Silakan coba lagi.');
            }

            await sock.updateProfilePicture(msg.chat, imageBuffer);
            
            return msg.reply('✅ *SUCCESS*\nFoto profil grup berhasil diperbarui.');
        } catch (err) {
            console.error(err);
            return msg.reply('❌ Gagal mengubah foto profil. Pastikan bot masih admin.');
        }
    }
};