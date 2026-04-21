import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settingsPath = path.resolve(__dirname, '../../settings.js');

export default {
    command: 'noprefix',
    alias: ['nopref'],
    category: 'owner',
    description: `Mengatur mode noprefix (tanpa prefix) untuk seluruh bot secara global.`,
    help: '`<true/false>`',
    onlyOwner: true,

    async execute(m, sock, args) {
        const arg = args[0]?.toLowerCase();

        if (!arg) {
            const status = config.noprefix ? '✅ AKTIF' : '❌ NONAKTIF';
            const prefixInfo = config.noprefix ? 'Tanpa Prefix' : config.prefixes.join(', ');
            return sock.sendMessage(m.chat, {
                text: `Mode noprefix: ${status}\nPrefix sekarang: ${prefixInfo}\n\nKetik ${m.prefix}${m.command} on/off untuk ubah`
            }, { quoted: m });
        }

        let newValue;
        if (['on', 'aktif', 'true', '1'].includes(arg)) newValue = true;
        else if (['off', 'matikan', 'nonaktif', 'false', '0'].includes(arg)) newValue = false;
        else return sock.sendMessage(m.chat, { text: 'Gunakan: on / off / aktif / matikan' }, { quoted: m });

        config.noprefix = newValue;
        global.noprefix = newValue;

        const statusText = newValue ? '✅ AKTIF' : '❌ NONAKTIF';
        const currentPrefix = newValue ? 'Tanpa Prefix' : config.prefixes.join(', ');

        await sock.sendMessage(m.chat, {
            text: `Mode noprefix diubah: ${statusText}\nPrefix sekarang: ${currentPrefix}`
        }, { quoted: m });

        try {
            if (!fs.existsSync(settingsPath)) return;

            let content = fs.readFileSync(settingsPath, 'utf-8');
            
            const regexConfig = /noprefix:\s*(true|false)/;
            const regexGlobal = /global\.noprefix\s*=\s*(true|false)/;

            let isChanged = false;

            if (regexConfig.test(content)) {
                content = content.replace(regexConfig, `noprefix: ${newValue}`);
                isChanged = true;
            }

            if (regexGlobal.test(content)) {
                content = content.replace(regexGlobal, `global.noprefix = ${newValue}`);
                isChanged = true;
            }

            if (!isChanged) {
                content = content.replace(
                    /console\.log\("Global settings telah dimuat\."\);/,
                    `global.noprefix = ${newValue};\nconsole.log("Global settings telah dimuat.");`
                );
            }

            fs.writeFileSync(settingsPath, content, 'utf-8');
        } catch (err) {
            console.error(err);
        }
    }
};