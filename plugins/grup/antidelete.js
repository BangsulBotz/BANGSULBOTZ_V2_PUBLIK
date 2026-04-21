import { getGroupSetting, setGroupSetting } from '../../database/db_group.js';

export default {
    command: "antidelete",
    alias: ["antihapus"],
    description: `Mengaktifkan fitur deteksi pesan yang dihapus (Anti-Revoke).

*Cara Penggunaan:*
- \`on\`: Pesan yang dihapus oleh orang lain akan dikirim ulang oleh bot.
- \`off\`: Mematikan fitur deteksi hapus pesan.

*Contoh:*
- \`antidelete on\`

*Catatan:* Bot akan mengirimkan kembali pesan asli beserta informasi pengirim dan tipe pesan yang dihapus (Teks/Gambar/Sticker).`,
    help: '`<on/off>`',
    onlyGroup: true,
    onlyAdmin: true, 
    onlyBotAdmin: true,
    typing: true,

    async execute(m, sock, args) {
        const current = getGroupSetting(m.chat, 'antidelete');

        if (!args[0]) {
            const status = current ? "AKTIF" : "NON-AKTIF";
            return await m.reply(
                `Status Antidelete di grup ini: *${status}*\n\n` +
                `Gunakan:\n` +
                `${m.prefix}${m.command} \`on\`\n` +
                `${m.prefix}${m.command} \`off\``
            );
        }

        const input = args[0].toLowerCase();
        let target;
        
        if (["on", "aktif", "1"].includes(input)) {
            if (current === true) return m.reply("Fitur antidelete sudah aktif sebelumnya.");
            target = true;
        } else if (["off", "mati", "0"].includes(input)) {
            if (current === false) return m.reply("Fitur antidelete sudah non-aktif sebelumnya.");
            target = false;
        } else {
            return await m.reply("Gunakan: on / off");
        }

        setGroupSetting(m.chat, 'antidelete', target);
        await m.reply(`Fitur Antidelete sekarang: *${target ? "AKTIF" : "NON-AKTIF"}* ✓`);
    }
};