import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antitagall',
    alias: ['antiata'],
    description: `Mengaktifkan fitur deteksi pesan Tag All / Hidetag dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Menghapus pesan Tag All.
- \`kick\`: Mengeluarkan pengirim Tag All.
- \`both\`: Menghapus pesan dan mengeluarkan pengirimnya.

*Contoh:*
- \`.antitagall on kick\`

*Catatan:* Fitur ini mendeteksi pesan yang menggunakan fitur mention semua anggota grup (hidetag/nonJidMentions).`,
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

            // Menyimpan ke kolom 'antitagall' di database
            setGroupSetting(msg.chat, 'antitagall', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur anti tag all diaktifkan.
Tendang: ${statusKick}
Hapus: ${statusDelete}

Gunakan salah satu perintah berikut:
${cmd} on ${option === 'kick' ? 'delete' : 'kick'}
> (ubah sanksi ke ${option === 'kick' ? 'hapus pesan' : 'tendang'})

${cmd} on both
> (hapus pesan dan tendang anggota)`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antitagall', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur anti tag all dinonaktifkan.
Tendang: ❌
Hapus: ❌

Gunakan \`${cmd} on option\` untuk mengaktifkan kembali.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang anggota yang mengirim tag all)

${cmd} on delete
> (hapus pesan tag all)

${cmd} on both
> (hapus pesan dan tendang anggota)

${cmd} off
> (nonaktifkan fitur anti tag all)`);
        }
    }
};