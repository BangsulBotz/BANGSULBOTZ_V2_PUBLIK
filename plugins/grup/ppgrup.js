export default {
    command: 'ppgc',
    alias: ['getppgc','ppgrup','ppgroup'],
    onlyOwner: true,
    typing:true,
    async execute(m, sock, args) {
        try {
            const text = args[0] || (m.quoted ? m.quoted.text : '');
            const inviteCode = text?.match(/chat.whatsapp.com\/([\w\d]*)/)?.[1];
            
            let jid;
            if (inviteCode) {
                const inviteInfo = await sock.groupGetInviteInfo(inviteCode);
                jid = inviteInfo.id;
            } else {
                jid = m.quoted ? m.quoted.sender : m.chat;
            }

            const ppUrl = await sock.profilePictureUrl(jid, 'image');

            await sock.sendMessage(m.chat, { 
                image: { url: ppUrl }, 
                caption: `✅ *Success Get Profile Picture*\n\n◦ *JID:* ${jid}` 
            }, { quoted: m });

        } catch (err) {
            m.reply('❌ Gagal: Foto tidak ditemukan atau akun diprivasi.');
        }
    }
};