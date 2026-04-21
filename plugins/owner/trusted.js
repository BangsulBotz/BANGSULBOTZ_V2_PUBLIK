import { trustedDb, getUserData, normalizeJid } from '../../database/db_user.js';

export default {
    command: 'trusted',
    alias: ['trust', 'addtrust'],
    description: 'Memberi akses trusted murni SQLite',
    help:'`(reply)<fitur>`',
    onlyOwner: true,

    async execute(m, sock, args, allPlugins) {
        if (args.length < 1) {
            return m.reply(`Cara pakai: ${m.prefix}${m.command} <fitur/alias> @tag/reply`);
        }

        const query = args[0].toLowerCase().trim();
        const targetPlugin = allPlugins.get(query) || [...allPlugins.values()].find(p => 
            p.command.toLowerCase() === query || (p.alias && p.alias.some(a => a.toLowerCase() === query))
        );

        if (!targetPlugin) return m.reply(`Fitur "${query}" tidak ditemukan.`);
        const featureKey = targetPlugin.command;

        let inputJid = m.quoted ? m.quoted.sender : (m.mentionedJid?.[0] || args[1]);
        if (!inputJid) return m.reply('Tag atau reply orangnya!');
        
        const normId = normalizeJid(inputJid);

        const userRow = getUserData(normId);

        if (!userRow) {
            return m.reply('User tidak ada di database bot. Suruh dia chat dulu!');
        }

        const isAlreadyTrusted = trustedDb.check(userRow.jid, featureKey);
        if (isAlreadyTrusted) {
            return m.reply(`*${userRow.name}* sudah punya akses trusted untuk fitur *${featureKey}*.`);
        }

        try {
            trustedDb.add(userRow.jid, featureKey);
            
            await m.reply(
                `✅ *TRUSTED ADDED (SQLITE)*\n\n` +
                `◦ *Fitur:* ${featureKey}\n` +
                `◦ *User:* ${userRow.name}\n` +
                `◦ *PN:* ${userRow.jid.split('@')[0]}\n` +
                `◦ *LID:* ${userRow.lid || '-'}\n\n` +
                `Akses diberikan secara permanen via database.`
            );
        } catch (e) {
            await m.reply('Gagal menambahkan trusted: ' + e.message);
        }
    }
};