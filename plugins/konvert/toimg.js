import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execute = promisify(exec);

export default {
    command: 'toimage',
    alias: ['toimg','togambar'],
    description: 'Ubah stiker menjadi gambar',
    help: '`(reply sticker)`',
    typing: true,
    wait: true,

    async execute(m, sock) {
        if (!m.quoted || !/webp/.test(m.quoted.mime)) {
            return m.reply(`Balas stiker yang ingin diubah menjadi gambar.`);
        }

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const fileName = path.join(tempDir, `${Date.now()}`);
        const input = `${fileName}.webp`;
        const output = `${fileName}.png`;

        try {
            const buffer = await m.quoted.download();
            fs.writeFileSync(input, buffer);

            await execute(`ffmpeg -i ${input} ${output}`);

            if (!fs.existsSync(output)) throw new Error();

            await sock.sendMessage(m.chat, { 
                image: fs.readFileSync(output),
                caption: 'Berhasil mengambil foto profil.' 
            }, { quoted: m });

        } catch (e) {
            m.reply('Gagal mengonversi stiker ke gambar.');
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
        }
    }
};