import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execute = promisify(exec);

export default {
    command: 'toaudio',
    alias: ['toaud'],
    description: 'Ubah video atau voice note menjadi audio MP3',
    help: '`(reply video/vn)`',
    typing: true,
    wait: true,

    async execute(m, sock) {
        if (!m.quoted || !/video|audio/.test(m.quoted.mime)) {
            return m.reply('Balas video atau audio yang ingin diubah menjadi MP3.');
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
                audio: fs.readFileSync(output), 
                mimetype: 'audio/mpeg' 
            }, { quoted: m });

        } catch (e) {
            console.error(e);
            m.reply('Gagal mengonversi media ke audio.');
        } finally {
            if (fs.existsSync(input)) fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
        }
    }
};