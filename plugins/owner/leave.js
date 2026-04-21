export default {
    command: 'leave',
    alias: ['out', 'keluar'],
    description: 'Mengeluarkan bot dari grup.',
    onlyOwner: true,
    typing: true,
    async execute(m, sock, args) {
        try {
            let targetJid = args[0] ? args[0] : m.chat;

            if (targetJid.includes('chat.whatsapp.com/')) {
                const code = targetJid.split('https://chat.whatsapp.com/')[1].split(' ')[0];
                const info = await sock.groupGetInviteInfo(code).catch(() => null);
                if (!info) return m.reply('❌ Link grup tidak valid.');
                targetJid = info.id;
            }

            if (!targetJid.endsWith('@g.us')) {
                return m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup atau dengan JID grup yang valid.');
            }

            await sock.sendMessage(targetJid, { 
                text: `Sesuai perintah owner, bot akan meninggalkan grup ini. Bye-bye! 👋` 
            });

            await sock.groupLeave(targetJid);

            if (targetJid !== m.chat) {
                await m.reply(`✅ Berhasil keluar dari grup:\n${targetJid}`);
            }

        } catch (err) {
            console.error(err);
            m.reply('❌ Terjadi kesalahan saat mencoba keluar dari grup.');
        }
    }
};