import { db, getName } from '../../database/db_user.js';

export default {
    command: 'trustlist',
    alias: ['listtrust', 'trustedlist', 'lsttrusted', 'trustedls', 'trustls'],
    description: 'Menampilkan semua user yang punya akses trusted dari database SQLite',
    onlyOwner: true,

    async execute(m, sock, args, allPlugins) {
        const querySQL = `
            SELECT 
                tc.jid, 
                tc.command as feature, 
                tc.added_at, 
                u.name, 
                u.lid 
            FROM trusted_commands tc
            LEFT JOIN users u ON tc.jid = u.jid
            ORDER BY tc.added_at DESC
        `;

        const allTrusted = db.prepare(querySQL).all();

        if (!allTrusted || allTrusted.length === 0) {
            return m.reply('*KOSONG:* Belum ada user yang terdaftar di tabel trusted (SQLite).');
        }

        let text = `📋 *DAFTAR TRUSTED USER (SQLITE)*\n\n`;
        text += `Total: *${allTrusted.length}* akses terdaftar\n`;
        text += `_Gunakan nomor urut untuk hapus (coming soon)_ \n\n`;

        allTrusted.forEach((entry, i) => {
            const plugin = allPlugins.get(entry.feature) || 
                           [...allPlugins.values()].find(p => p.command === entry.feature);
            
            const aliases = plugin?.alias?.length ? plugin.alias.join(', ') : '-';
            const pushname = entry.name || 'Unknown';
            const pn = entry.jid ? entry.jid.split('@')[0] : 'Error';
            const lid = entry.lid ? entry.lid.split('@')[0] : '-';
            
            const date = entry.added_at ? new Date(entry.added_at).toLocaleString('id-ID') : '-';

            text += `*${i + 1}. ${pushname}*\n`;
            text += `   ◦  *JID:* ${pn}\n`;
            text += `   ◦  *LID:* ${lid}\n`;
            text += `   ◦  *Fitur:* \`${entry.feature}\`\n`;
            if (aliases !== '-') {
                text += `   ◦  *Alias:* _${aliases}_\n`;
            }
            text += `   ◦  *Waktu:* ${date}\n\n`;
        });

        global.tempTrustedList = allTrusted;

        await m.reply(text.trim());
    }
};