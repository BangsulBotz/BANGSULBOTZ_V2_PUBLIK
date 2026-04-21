import { generateWAMessageFromContent } from 'baileys';
import { getTopFeatures, getOldestHitTimestamp } from '../../database/db_hit.js';

export default {
    command: 'tophit',
    alias: ['hits', 'hitall', 'hitlist', 'commandstats', 'featurehits'],
    description: 'Menampilkan statistik penggunaan command (WIB).',
    help: '`<tgl> <bln> / all`',
    typing: true,

    async execute(m, sock, args) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        const nowMs = Date.now();
        const nowWIB = new Date(nowMs + (7 * 60 * 60 * 1000));
        
        let startTs;
        let usedFullRange = false;
        let tgl = nowWIB.getUTCDate();
        let bln = nowWIB.getUTCMonth();
        let thn = nowWIB.getUTCFullYear();

        if (args[0]?.toLowerCase() === 'all') {
            const oldest = getOldestHitTimestamp();
            if (!oldest) return m.reply('❌ Belum ada data hit yang terekam.');
            startTs = oldest;
            usedFullRange = true;
        } else {
            if (args[0]) {
                const parsedTgl = parseInt(args[0]);
                if (!isNaN(parsedTgl) && parsedTgl >= 1 && parsedTgl <= 31) {
                    tgl = parsedTgl;
                } else {
                    return m.reply('❌ Tanggal tidak valid.');
                }
            }

            if (args[1]) {
                const argMonth = args[1].toLowerCase();
                const monthIndex = monthNames.findIndex(mn => mn.toLowerCase().startsWith(argMonth));
                if (monthIndex !== -1) {
                    bln = monthIndex;
                } else {
                    const parsedMonth = parseInt(args[1]);
                    if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
                        bln = parsedMonth - 1;
                    } else {
                        return m.reply('❌ Format bulan tidak valid.');
                    }
                }
            }

            if (!args[0] && !args[1]) {
                const secondsPassedToday = (nowWIB.getUTCHours() * 3600) + (nowWIB.getUTCMinutes() * 60) + nowWIB.getUTCSeconds();
                startTs = Math.floor(nowMs / 1000) - secondsPassedToday;
            } else {
                const targetDate = new Date(Date.UTC(thn, bln, tgl, 0, 0, 0));
                targetDate.setTime(targetDate.getTime() - (7 * 60 * 60 * 1000));
                startTs = Math.floor(targetDate.getTime() / 1000);
            }
        }

        try {
            const endTs = Math.floor(nowMs / 1000);
            let hits = getTopFeatures(10, startTs, endTs);

            if ((!hits || hits.length === 0) && !usedFullRange) {
                const oldestTs = getOldestHitTimestamp();
                if (!oldestTs) return m.reply('❌ Belum ada data hit yang terekam.');
                
                hits = getTopFeatures(10, oldestTs, endTs);
                usedFullRange = true;
            }

            if (!hits || hits.length === 0) return m.reply('❌ Tidak ada data pada periode ini.');

            const totalHits = hits.reduce((sum, r) => sum + Number(r.total), 0);
            let dateRangeStr;

            if (usedFullRange) {
                const firstTs = getOldestHitTimestamp();
                const firstDate = new Date(firstTs * 1000 + (7 * 60 * 60 * 1000));
                dateRangeStr = `${firstDate.getUTCDate()} ${monthNames[firstDate.getUTCMonth()]} ${firstDate.getUTCFullYear()} - Sekarang`;
            } else {
                dateRangeStr = `${tgl} ${monthNames[bln]} ${thn}`;
            }

            const pollVotes = hits.map(row => ({
                optionName: `${row.feature}`,
                optionVoteCount: Number(row.total)
            }));

            const pollContent = {
                pollResultSnapshotMessage: {
                    name: `📊 *TOP HIT COMMAND*\n📅 Rentang: ${dateRangeStr}\n📈 TOTAL: ${totalHits} Hit`,
                    pollVotes: pollVotes,
                    pollType: 0
                }
            };

            const msg = await generateWAMessageFromContent(m.chat, pollContent, { quoted: m });
            await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

        } catch (e) {
            await m.reply('❌ Gagal menampilkan statistik command.');
        }
    }
};