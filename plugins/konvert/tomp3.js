import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from '../../settings.js';

const execute = promisify(exec);

export default {
    command: 'tomp3',
    description: 'Ubah video/audio menjadi file dokumen MP3',
    help: '`(reply video/audio)`',
    typing: true,
    wait: true,

    async execute(m, sock) {
        if (!m.quoted || !/video|audio/.test(m.quoted.mime)) {
            return m.reply('Balas video atau audio yang ingin diubah menjadi file dokumen MP3.');
        }

        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const fileName = path.join(tempDir, `${Date.now()}`);
        const input = `${fileName}.data`;
        const output = `${fileName}.mp3`;

        try {
            const buffer = await m.quoted.download();
            fs.writeFileSync(input, buffer);

            await execute(`ffmpeg -i ${input} -vn -ac 2 -b:a 128k -ar 44100 ${output}`);

            if (!fs.existsSync(output)) throw new Error();

            await sock.sendMessage(m.chat, { 
                document: fs.readFileSync(output), 
                mimetype: 'audio/mpeg',
                fileName: `Audio_By_${config.botName}.mp3`
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Gagal mengonversi media ke file MP3.');
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
        }
    }
};