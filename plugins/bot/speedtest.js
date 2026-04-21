import util from 'util';
import { exec } from 'child_process';
import config from '../../settings.js';
const execPromise = util.promisify(exec);

export default {
    command: 'speedtest',
    alias: ['speed', 'tesspeed'],
    description: 'Menjalankan tes kecepatan server.',
    typing: true,

    async execute(m, sock) {
        try {
            await m.reply(config.pesan.wait);

            const { stdout, stderr } = await execPromise('python3 speed.py');

            if (stdout.trim()) {
                await m.reply(`*🚀 Speedtest Result:*\n\n${stdout.trim()}`);
            }

            if (stderr.trim()) {
                console.error('Speedtest Stderr:', stderr);
            }

        } catch (err) {
            console.error('Error Speedtest:', err);
            
            if (err.message.toLowerCase().includes('forbidden')) {
                return m.reply('⚠️ Speedtest diblokir (Forbidden) oleh penyedia layanan.');
            }
            
            if (err.message.toLowerCase().includes('not found')) {
                return m.reply('⚠️ File `speed.py` tidak ditemukan di direktori utama.');
            }

            m.reply(`*Terjadi kesalahan:* ${err.message}`);
        }
    }
};