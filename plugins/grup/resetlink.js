export default {
    command: 'resetlink',
    alias: ['revoke', 'resetlinkgc', 'newurl'],
    description: `Menyetel ulang atau menarik tautan undangan grup saat ini.

*Cara Penggunaan:*
- \`.resetlink\`

*Efek:*
- Tautan undangan grup yang lama akan hangus.
- Bot akan membuat tautan undangan baru secara otomatis.`,
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock) => {
        try {
            await sock.groupRevokeInvite(msg.chat);
            
            const groupMetadata = await sock.groupMetadata(msg.chat);
            const groupName = groupMetadata.subject || 'Grup';

            return msg.reply(`🔄 *LINK RESET SUCCESS*
Tautan undangan untuk grup telah berhasil disetel ulang. Tautan lama sudah tidak dapat digunakan.`);
        } catch (err) {
            console.error(err);
            return msg.reply('❌ Gagal menyetel ulang tautan undangan. Pastikan bot masih menjadi admin.');
        }
    }
};