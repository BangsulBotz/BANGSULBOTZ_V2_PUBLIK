export default {
    command: 'listafk',
    alias: ['afklist'],
    description: 'Menampilkan daftar user yang sedang AFK di grup ini.',
    onlyGroup: true,
    execute: async (msg, sock) => {
        const groupId = msg.chat;
        const afkData = global.botDb.afk?.[groupId] || {};
        const userIds = Object.keys(afkData);

        if (userIds.length === 0) return msg.reply("Tidak ada user yang AFK di grup ini.");

        let text = `*── 「 LIST AFK GRUP 」 ──*\n\n`;
        const displayedUsers = new Set();
        const mentions = [];
        let count = 1;

        userIds.forEach(id => {
            const data = afkData[id];
            if (displayedUsers.has(data.lid)) return;
            displayedUsers.add(data.lid);

            const mentionId = data.pn || data.lid;
            mentions.push(mentionId);

            const timeString = new Date(data.time).toLocaleString('id-ID', { 
                timeZone: 'Asia/Jakarta',
                hour: '2-digit', 
                minute: '2-digit',
                day: '2-digit',
                month: 'short'
            });
            
            text += `${count++}. @${mentionId.split('@')[0]}\n`;
            text += `   ◦ *Nama:* ${data.name.trim()}\n`;
            text += `   ◦ *Alasan:* ${data.reason}\n`;
            text += `   ◦ *Sejak:* ${timeString} WIB\n\n`;
        });

        text += `_Total: ${displayedUsers.size} user sedang AFK_`;

        await msg.reply(text.trim(), { mentions: mentions });
    }
};