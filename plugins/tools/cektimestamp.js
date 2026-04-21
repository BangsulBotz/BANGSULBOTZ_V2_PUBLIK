export default {
    command: 'cekwaktu',
    alias: ['cekts', 'cektimestamp', 'cekstamp'],
    description: 'Mengkonversi Unix Timestamp ke format waktu yang mudah dibaca.',
    help: '`<timestamp>`',
    async execute(m, sock, args) {
        const input = args[0];

        if (!input || isNaN(input)) {
            return m.reply(`❌ *Format Salah!*\n\n` +
                          `Gunakan: \`${m.prefix}${m.command} <timestamp>\`\n` +
                          `Contoh: \`${m.prefix}${m.command} 1776430838\``);
        }

        const timestamp = parseInt(input);

        // Validasi timestamp
        if (timestamp < 0 || timestamp > 4102444800) {
            return m.reply('❌ Timestamp tidak valid atau di luar jangkauan.');
        }

        const date = new Date(timestamp * 1000);

        // Format lengkap WIB
        const waktuLengkap = date.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        // Format singkat
        const waktuSingkat = date.toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'medium',
            timeStyle: 'medium'
        });

        let teks = `✅ *HASIL KONVERSI TIMESTAMP*\n\n`;
        teks += `🕒 *Timestamp:* \`${timestamp}\`\n\n`;
        teks += `📅 *Tanggal & Waktu (WIB):*\n`;
        teks += `   ${waktuLengkap} WIB`;

        await m.reply(teks);
    }
};