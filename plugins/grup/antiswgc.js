import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antiswgc',
    alias: ['antisw'],
    description: `Mengaktifkan fitur deteksi pengiriman Status ke dalam Grup dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Menghapus pesan SW GC.
- \`kick\`: Mengeluarkan pengirim.
- \`both\`: Hapus & Tendang.

*Contoh:*
- \`.antiswgc on delete\``,
    help: '`<on/off> <option>`',
    onlyAdmin: true,
    onlyGroup: true,
    onlyBotAdmin: true,
    typing: true,
    execute: async (msg, sock, args) => {
        const action = args[0]?.toLowerCase();
        const option = args[1]?.toLowerCase();
        const cmd = `${msg.prefix}${msg.command}`;

        if (action === 'on' && option) {
            if (!['delete', 'kick', 'both'].includes(option)) {
                return msg.reply(`Format salah! Pilih sanksi: delete, kick, atau both.`);
            }

            const config = {
                status: true,
                delete: option === 'delete' || option === 'both',
                kick: option === 'kick' || option === 'both'
            };

            setGroupSetting(msg.chat, 'antiswgc', config);

            return msg.reply(`Fitur anti sw gc diaktifkan.\nSanksi: ${option.toUpperCase()}`);
        } 
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antiswgc', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur anti sw gc dinonaktifkan.`);
        } 
        else {
            return msg.reply(`Format: \`${cmd} <on/off> <option>\``);
        }
    }
};