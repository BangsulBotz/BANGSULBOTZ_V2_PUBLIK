export default {
    command: 'afk',
    description: 'Mengatur status AFK khusus grup ini.',
    help: '`<alasan>`',
    onlyGroup: true,
    typing: true,
    execute: async (msg, sock, args) => {
        const reason = args.join(' ') || 'Tanpa Alasan';
        const time = Date.now();
        const name = msg.pushName || 'User';
        const groupId = msg.chat;
        const lid = msg.key.participant || msg.sender;
        const raw = msg.raw || msg; 
        const pn = raw.key?.participantAlt || (msg.sender.includes('@s.whatsapp.net') ? msg.sender : null);

        if (!global.botDb.afk) global.botDb.afk = {};
        if (!global.botDb.afk[groupId]) global.botDb.afk[groupId] = {};

        const afkObj = {
            reason: reason,
            time: time,
            name: name,
            lid: lid,
            pn: pn
        };

        if (lid) global.botDb.afk[groupId][lid] = afkObj;
        if (pn && pn !== lid) global.botDb.afk[groupId][pn] = afkObj;

        global.saveBotDb();

        const date = new Date(time).toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour12: false
        });

        return msg.reply(`*── 「 USER AFK 」 ──*\n\n` +
            `@${msg.sender.split('@')[0]} sekarang AFK di grup ini!\n` +
            `◦ *Alasan:* ${reason}\n` +
            `◦ *Pada:* ${date}`, { mentions: [msg.sender] });
    }
};