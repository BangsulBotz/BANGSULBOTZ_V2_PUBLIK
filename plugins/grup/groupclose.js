export default {
    command: 'grupclose',
    alias: ['groupclose', 'closegc'],
    description: `Menutup grup sehingga hanya admin yang dapat mengirim pesan.

*Cara Penggunaan:*
- \`.grupclose\`

*Efek:*
- Mengubah setelan grup menjadi "Hanya Admin".
- Peserta biasa tidak bisa mengirim pesan hingga grup dibuka kembali.`,
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock) => {
        try {
            await sock.groupSettingUpdate(msg.chat, 'announcement');
            
            return msg.reply(`🔒 *GROUP CLOSED*
Berhasil menutup grup. Sekarang hanya admin yang dapat mengirim pesan ke dalam grup ini.`);
        } catch (err) {
            console.error(err);
            return msg.reply('❌ Gagal menutup grup. Pastikan bot masih menjadi admin.');
        }
    }
};