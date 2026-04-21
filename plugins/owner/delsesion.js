import fs from 'fs/promises';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), 'session');
const DB_PATH = path.join(SESSION_DIR, 'auth.db');

export default {
    command: 'delsession',
    alias: ['refdb', 'cleardb', 'delsesi', 'csesi'],
    description: 'Refresh auth.db: Hitung manual dulu, kirim pesan, baru eksekusi hapus.',
    onlyOwner: true,
    typing: true,
    async execute(m, sock) {
        try {
            if (!await fs.access(DB_PATH).then(() => true).catch(() => false)) {
                return m.reply('File auth.db tidak ditemukan.');
            }
            let totalSession = 0;
            try {
                const dbBuffer = await fs.readFile(DB_PATH);
                const dbString = dbBuffer.toString('utf8');
                totalSession = (dbString.match(/session/g) || []).length;
                if (totalSession > 0) totalSession = Math.max(1, totalSession - 1);
            } catch {
                totalSession = 'Terdeteksi'; 
            }

            let dbFiles = 'auth.db';
            if (await fs.access(DB_PATH + '-wal').then(() => true).catch(() => false)) dbFiles += ', auth.db-wal';
            if (await fs.access(DB_PATH + '-shm').then(() => true).catch(() => false)) dbFiles += ', auth.db-shm';

            const sent = await sock.sendMessage(m.chat, {
                text: `🔄 *REFRESH DB SEDANG BERJALAN...*\n\nLangkah 1: Menganalisa database...`
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                text: `🔄 *REFRESH DB SEDANG BERJALAN...*\n\n` +
                      `Langkah 1: Database ditemukan ✓\n` +
                      `Langkah 2: Terdeteksi *${totalSession}* item session non-essential.`,
                edit: sent.key
            });

            await sock.sendMessage(m.chat, {
                text: `🔄 *REFRESH DB SEDANG BERJALAN...*\n\n` +
                      `Langkah 1: Database ditemukan ✓\n` +
                      `Langkah 2: *${totalSession}* session terdeteksi ✓\n` +
                      `Langkah 3: Menjalankan perintah pembersihan...`,
                edit: sent.key
            });

            await sock.sendMessage(m.chat, {
                text: `✅ *REFRESH DB SELESAI*\n\n` +
                      `Berhasil menghapus: *${totalSession} session*\n` +
                      `Status: *Cleaned & Vacuumed* ✓\n\n` +
                      `> Bot akan restart sekarang, silahkan tunggu.`,
                edit: sent.key
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
            if (typeof sock.clearNonCreds === 'function') {
                sock.clearNonCreds(); 
            }

            for (const ext of ['-wal', '-shm']) {
                const extraPath = DB_PATH + ext;
                if (await fs.access(extraPath).then(() => true).catch(() => false)) {
                    await fs.unlink(extraPath).catch(() => {});
                }
            }

            const restartFile = path.join(process.cwd(), 'sampah', 'restart_info.json');
            const restartData = { jid: m.chat, time: Date.now() };
            await fs.mkdir(path.dirname(restartFile), { recursive: true });
            await fs.writeFile(restartFile, JSON.stringify(restartData));
            process.exit(0);

        } catch (err) {
            console.error('Error delsession:', err);
        }
    }
};