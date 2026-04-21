export default {
    command: 'grupopen',
    alias: ['groupopen', 'opengc'],
    description: `Membuka grup sehingga semua anggota dapat mengirim pesan kembali.

*Cara Penggunaan:*
- \`.grupopen\`

*Efek:*
- Mengubah setelan grup menjadi "Semua Peserta".
- Anggota biasa dapat mengirim pesan kembali seperti semula.`,
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock) => {
        try {
            await sock.groupSettingUpdate(msg.chat, 'not_announcement');
            
            return msg.reply(`🔓 *GROUP OPENED*
Berhasil membuka grup. Sekarang semua anggota dapat mengirim pesan ke dalam grup ini.`);
        } catch (err) {
            console.error(err);
            return msg.reply('❌ Gagal membuka grup. Pastikan bot masih menjadi admin.');
        }
    }
};