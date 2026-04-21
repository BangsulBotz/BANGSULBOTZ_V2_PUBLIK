export default {
    command: 'anticall',
    alias: ['antitelpon'],
    description: 'Mengaktifkan atau menonaktifkan fitur penolakan panggilan otomatis.',
    help: '`<on/off>`',
    onlyOwner: true,
    typing: true,
    execute: async (msg, sock, args) => {
        const arg = args[0]?.toLowerCase();
        const cmd = `${msg.prefix}${msg.command}`;

        if (!arg) {
            const status = global.botDb.botSettings.anticall ? '✅ AKTIF' : '❌ MATI';
            return msg.reply(`Status Anticall: ${status}\nKetik \`${cmd} on/off\` untuk ubah.`);
        }

        let newValue;
        if (['on', 'aktif', '1'].includes(arg)) newValue = true;
        else if (['off', 'mati', '0'].includes(arg)) newValue = false;
        else return msg.reply('Gunakan: `on` atau `off`');
        global.botDb.botSettings.anticall = newValue;
        global.saveBotDb(); 

        return msg.reply(`Fitur Anticall berhasil diubah menjadi: ${newValue ? '✅ AKTIF' : '❌ MATI'} ✓`);
    }
};