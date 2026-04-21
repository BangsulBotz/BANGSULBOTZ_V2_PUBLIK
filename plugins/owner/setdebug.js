import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../settings.js'; 

// Cara paling aman mendapatkan path settings.js yang ada di root folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const settingsPath = path.resolve(__dirname, '../../settings.js'); 

export default {
    command: 'setdebug',
    alias: ['debugjson', 'debugraw', 'debugrawjson'],
    description: `Aktifkan/matikan debug raw JSON pesan masuk.`,
    onlyOwner: true,
    async execute(m, sock, args) {
        const arg = args[0]?.toLowerCase();

        if (!arg) {
            const status = config.debugRawJson ? '✅ AKTIF' : '❌ MATI';
            return sock.sendMessage(m.chat, {
                text: `*DEBUG RAW JSON STATUS*\n\nStatus: ${status}\n\nGunakan: \`${m.prefix}${m.command} on/off\``
            }, { quoted: m });
        }

        let newValue;
        if (['on', 'aktif', 'true', '1'].includes(arg)) newValue = true;
        else if (['off', 'mati', 'nonaktif', 'false', '0'].includes(arg)) newValue = false;
        else return sock.sendMessage(m.chat, { text: 'Gunakan: on / off' }, { quoted: m });

        // Update RAM
        config.debugRawJson = newValue;
        global.debugRawJson = newValue;

        try {
            // Baca file
            if (!fs.existsSync(settingsPath)) {
                throw new Error(`File tidak ditemukan di: ${settingsPath}`);
            }

            let content = fs.readFileSync(settingsPath, 'utf-8');

            const regexConfig = /debugRawJson:\s*(true|false)/;
            const regexGlobal = /global\.debugRawJson\s*=\s*(true|false)/;

            let isChanged = false;

            if (regexConfig.test(content)) {
                content = content.replace(regexConfig, `debugRawJson: ${newValue}`);
                isChanged = true;
            }
            if (regexGlobal.test(content)) {
                content = content.replace(regexGlobal, `global.debugRawJson = ${newValue}`);
                isChanged = true;
            }

            if (isChanged) {
                fs.writeFileSync(settingsPath, content, 'utf-8');
                await sock.sendMessage(m.chat, { text: `✅ Berhasil! File diperbarui & RAM diupdate.` }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, { text: `⚠️ RAM diupdate, tapi teks 'debugRawJson' tidak ditemukan di file settings.js.` }, { quoted: m });
            }
            
        } catch (err) {
            console.error("DEBUG SAVE ERROR:", err);
            // Kirim detail error ke chat agar kamu tahu kenapa gagal
            await sock.sendMessage(m.chat, { 
                text: `❌ Gagal simpan ke file!\n\nError: ${err.message}` 
            }, { quoted: m });
        }
    }
};