import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antibot',
    alias: ['antibots'],
    description: `Mengaktifkan fitur deteksi bot luar dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Menghapus pesan bot.
- \`kick\`: Mengeluarkan bot tersebut.
- \`both\`: Menghapus pesan dan mengeluarkan bot.

*Contoh:*
- \`.antibot on kick\``,
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
                return msg.reply(`Format salah! Gunakan: 
\`${cmd} on delete\`
\`${cmd} on kick\`
\`${cmd} on both\``);
            }

            const config = {
                status: true,
                delete: option === 'delete' || option === 'both',
                kick: option === 'kick' || option === 'both'
            };

            setGroupSetting(msg.chat, 'antibot', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur *Antibot* berhasil diaktifkan.
◦ Tendang: ${statusKick}
◦ Hapus: ${statusDelete}

*Note:* Bot yang merupakan Admin grup tidak akan terkena sanksi ini.`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antibot', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur *Antibot* telah dinonaktifkan.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang bot yang terdeteksi)`);
        }
    }
};