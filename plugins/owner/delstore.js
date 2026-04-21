import fs from 'fs/promises';
import path from 'path';

const STORE_DIR = path.join(process.cwd(), 'database', 'store');

const handler = {
    command: 'delstore',
    alias: ['clearstore', 'hapusstore', 'rststore'],
    description: 'Menghapus seluruh isi di ./database/store/, lalu restart bot.',
    onlyOwner: true,
    typing: true,
    async execute(m, sock) {
        try {
            if (!await fs.access(STORE_DIR).then(() => true).catch(() => false)) {
                return m.reply('Folder ./database/store tidak ditemukan.');
            }

            const sent = await sock.sendMessage(m.chat, {
                text: `🔄 *MENGHAPUS ISI STORE SEDANG BERJALAN...*\n\nLangkah 1: Mengecek folder store...`
            }, { quoted: m });

            await new Promise(r => setTimeout(r, 500));

            const files = await fs.readdir(STORE_DIR);
            let totalSize = 0;
            let fileDetails = [];

            for (const file of files) {
                const fullPath = path.join(STORE_DIR, file);
                const stat = await fs.stat(fullPath);
                totalSize += stat.size;
                const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
                fileDetails.push(`${file} → ${sizeMB} MB`);
            }

            const totalMB = (totalSize / 1024 / 1024).toFixed(2);

            await sock.sendMessage(m.chat, {
                text: `🔄 *MENGHAPUS ISI STORE SEDANG BERJALAN...*\n\n` +
                      `Langkah 1: Folder ditemukan ✓\n` +
                      `Total file: ${files.length}\n` +
                      `Total ukuran: ${totalMB} MB\n\n` +
                      `Langkah 2: Menghapus ${files.length} file di store...`,
                edit: sent.key
            });

            await new Promise(r => setTimeout(r, 500));

            for (const file of files) {
                const fullPath = path.join(STORE_DIR, file);
                await fs.rm(fullPath, { force: true });
            }

            await sock.sendMessage(m.chat, {
                text: `✅ *PENGHAPUSAN STORE SELESAI*\n\n` +
                      `Total file dihapus: ${files.length}\n` +
                      `Total ukuran yang dibersihkan: ${totalMB} MB\n\n` +
                      `Bot akan otomatis restart dalam beberapa detik untuk merefresh database store baru.\nSilahkan tunggu sebentar...`,
                edit: sent.key
            });

            const restartFile = path.join(process.cwd(), 'sampah', 'restart_info.json');
            const restartData = { jid: m.chat, time: Date.now() };
            await fs.mkdir(path.dirname(restartFile), { recursive: true });
            await fs.writeFile(restartFile, JSON.stringify(restartData));

            setTimeout(() => process.exit(0), 3000);
        } catch (err) {
            console.error(err);
            m.reply('Error saat menghapus store: ' + err.message);
        }
    }
};

export default handler;