export default {
    command: 'linkgroup',
    alias: ['linkgc', 'urlgroup', 'linkgrup', 'urlgc'],
    description: 'Mendapatkan tautan undangan grup saat ini.',
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock) => {
        try {
            const groupCode = await sock.groupInviteCode(msg.chat);
            const groupMetadata = await sock.groupMetadata(msg.chat);
            
            const caption = `*🔗 LINK GROUP*\n\n` +
                          `📌 *Nama:* ${groupMetadata.subject}\n` +
                          `👤 *Oleh:* @${msg.sender.split('@')[0]}\n\n` +
                          `🌐 *Tautan:*\nhttps://chat.whatsapp.com/${groupCode}`;

            return sock.sendMessage(msg.chat, { 
                text: caption, 
                mentions: [msg.sender] 
            }, { quoted: msg });
        } catch (err) {
            console.error(err);
            return msg.reply('❌ Gagal mengambil tautan grup.');
        }
    }
};