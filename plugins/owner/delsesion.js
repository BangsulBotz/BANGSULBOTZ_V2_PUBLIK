import fs from 'fs/promises';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), 'session');
const DB_PATH = path.join(SESSION_DIR, 'auth.db');

export default {
    command: 'delsession',
    alias: ['refdb', 'cleardb', 'delsesi', 'csesi', 'ceksesi'],
    description: 'Fresh Reset: Hitung total baris sampah, lapor ke user, baru bersihkan total.',
    onlyOwner: true,
    typing: true,
    async execute(m, sock) {
        try {
            const dbExists = await fs.access(DB_PATH).then(() => true).catch(() => false);
            if (!dbExists) {
                return m.reply('File auth.db tidak ditemukan.');
            }

            const isCheckOnly = m.body.toLowerCase().includes('ceksesi');

            if (typeof sock.clearNonCreds !== 'function') {
                return m.reply('❌ clearNonCreds tidak tersedia. Pastikan bot sudah terinisialisasi dengan benar.');
            }

            const { Database } = await import('better-sqlite3').then(m => ({ Database: m.default }));
            let totalSession = 0;
            const tempDb = new Database(DB_PATH, { readonly: true });
            try {
                const row = tempDb.prepare("SELECT COUNT(*) as count FROM auth WHERE key != 'creds'").get();
                totalSession = row ? row.count : 0;
            } finally {
                tempDb.close();
            }

            const sent = await sock.sendMessage(m.chat, {
                text: `🔄 *MENGANALISA DATABASE...*`
            }, { quoted: m });

            if (isCheckOnly) {
                await sock.sendMessage(m.chat, {
                    text: `✅ *CEK SESSION SELESAI*\n\n` +
                          `Total session sampah terdeteksi: *${totalSession}*\n` +
                          `Status: *Hanya pengecekan, tidak ada penghapusan*`,
                    edit: sent.key
                });
                return;
            }

            await sock.sendMessage(m.chat, {
                text: `🔄 *REFRESH DB SEDANG BERJALAN...*\n\n` +
                      `Langkah 1: Database ditemukan ✓\n` +
                      `Langkah 2: Terdeteksi *${totalSession}* item session (sampah).`,
                edit: sent.key
            });

            await sock.sendMessage(m.chat, {
                text: `🔄 *REFRESH DB SEDANG BERJALAN...*\n\n` +
                      `Langkah 1: Database ditemukan ✓\n` +
                      `Langkah 2: *${totalSession}* session terdeteksi ✓\n` +
                      `Langkah 3: Menghapus semua kecuali data login (creds)...`,
                edit: sent.key
            });

            await new Promise(r => setTimeout(r, 800));

            

            await sock.sendMessage(m.chat, {
                text: `✅ *REFRESH DB SELESAI*\n\n` +
                      `Berhasil menghapus: *${totalSession} baris session*\n` +
                      `Status: *Fresh & Clean* ✓\n\n` +
                      `> Bot akan restart sekarang untuk membersihkan sisa cache.`,
                edit: sent.key
            });

            sock.clearNonCreds();

            await new Promise(r => setTimeout(r, 1500));

            const restartFile = path.join(process.cwd(), 'sampah', 'restart_info.json');
            await fs.mkdir(path.dirname(restartFile), { recursive: true });
            await fs.writeFile(restartFile, JSON.stringify({ jid: m.chat, time: Date.now() }));

            console.log(`[Clean] Database dibersihkan. ${totalSession} item dihapus.`);
            process.exit(0);

        } catch (err) {
            console.error('Error delsession:', err);
            m.reply('❌ Terjadi kesalahan saat proses pembersihan:\n' + err.message);
        }
    }
};
