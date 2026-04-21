import { getTopFeatures, db } from '../../database/db_hit.js';

export default {
    command: 'topuser',
    alias: ['topusers', 'toppengguna', 'aktifuser'],
    description: 'Menampilkan user paling banyak menggunakan command',
    help: '`<all/week/month>`',
    typing: true,

    async execute(m, sock, args) {
        let period = 'all';
        const input = (args[0] || '').toLowerCase().trim();

        if (input && ['week', 'month'].includes(input)) {
            period = input;
        }

        try {
            let query = `
                SELECT c.jid, COUNT(*) as total
                FROM feature_hits f
                JOIN chats c ON f.user_jid_id = c.id
            `;
            const params = [];

            if (period !== 'all') {
                let timeCond = '';
                if (period === 'week') timeCond = 'f.hit_time >= CAST(strftime(\'%s\', \'now\', \'-7 days\') AS INTEGER)';
                else if (period === 'month') timeCond = 'f.hit_time >= CAST(strftime(\'%s\', \'now\', \'-30 days\') AS INTEGER)';
                if (timeCond) {
                    query += ` WHERE ${timeCond}`;
                }
            }

            query += ' GROUP BY c.jid ORDER BY total DESC LIMIT 10';

            const rows = db.prepare(query).all(...params);

            if (!rows || rows.length === 0) {
                await m.reply('Belum ada data penggunaan command dari user manapun.');
                return;
            }

            const totalAll = rows.reduce((sum, r) => sum + Number(r.total), 0);

            let teks = `*🏆 TOP 10 USER PALING AKTIF*\nDalam periode: (${period.toUpperCase() === 'ALL' ? 'SEMUA WAKTU' : period.toUpperCase()})\n\n`;
            teks += `Total hit keseluruhan: \`${totalAll}×\`\n\n`;

            teks += '```';
            rows.forEach((row, i) => {
                const rank = (i + 1).toString();
                const jid = row.jid.split('@')[0];
                const count = row.total.toString();
                teks += `${rank} @${jid} ${count}×\n`;
            });
            teks += '```';

            teks += '\nData dari database hit';

            await m.reply(teks, {
                mentions: rows.map(r => r.jid)
            });

        } catch (e) {
            await m.reply('Gagal mengambil data top user.');
        }
    }
};