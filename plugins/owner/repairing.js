import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execPromise = promisify(exec);

const SESSION_DIR = path.join(process.cwd(), 'session');

export default {
    command: 'repairing',
    alias: ['repair', 'resetall', 'fullreset', 'resetsession'],
    description: 'Repair bot: Hapus total folder session lalu restart bot',
    onlyOwner: true,
    typing: true,
    wait: true,

    async execute(m, sock) {
        try {
            const sessionExists = await fs.access(SESSION_DIR)
                .then(() => true)
                .catch(() => false);

            if (!sessionExists) {
                return m.reply('❌ Folder session tidak ditemukan.');
            }

            const sent = await sock.sendMessage(m.chat, {
                text: `🔧 *REPAIRING BOT SEDANG BERJALAN...*\n\nSedang membersihkan semua session...`
            }, { quoted: m });

            await sock.sendMessage(m.chat, {
                text: `🔧 *REPAIRING BOT SEDANG BERJALAN...*\n\nLangkah 1: Folder session ditemukan ✓\nLangkah 2: Menghapus total folder session...`,
                edit: sent.key
            });

            await execPromise(`rm -rf "${SESSION_DIR}"`);

            await sock.sendMessage(m.chat, {
                text: `✅ *REPAIRING SELESAI*\n\nBerhasil menghapus folder session secara total.\n\nBot akan restart sekarang...\nMohon tunggu beberapa detik.`,
                edit: sent.key
            });

            const restartFile = path.join(process.cwd(), 'sampah', 'restart_info.json');
            const restartData = { 
                jid: m.chat, 
                time: Date.now(),
                type: 'repairing' 
            };

            await fs.mkdir(path.dirname(restartFile), { recursive: true });
            await fs.writeFile(restartFile, JSON.stringify(restartData));

            await new Promise(resolve => setTimeout(resolve, 1500));

            process.exit(0);

        } catch (err) {
            console.error('Error repairing:', err);
            await m.reply(`❌ Terjadi error saat repairing:\n${err.message}`);
        }
    }
};