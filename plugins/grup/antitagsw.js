import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antitagsw',
    alias: ['antiswtag', 'antistatusmention'],
    description: `Mengaktifkan fitur deteksi pesan "Tag Status/Story" dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Menghapus notifikasi tag status.
- \`kick\`: Mengeluarkan pengirim tag status.
- \`both\`: Menghapus pesan dan mengeluarkan pengirimnya.

*Contoh:*
- \`.antitagsw on kick\`

*Catatan:* Fitur ini mendeteksi pesan sistem yang muncul saat anggota grup menandai grup ini di Status/Story WhatsApp mereka.`,
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

            setGroupSetting(msg.chat, 'antitagsw', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur antitagsw diaktifkan.
Tendang: ${statusKick}
Hapus: ${statusDelete}

Gunakan salah satu perintah berikut:
${cmd} on ${option === 'kick' ? 'delete' : 'kick'}
> (ubah sanksi ke ${option === 'kick' ? 'hapus pesan' : 'tendang'})

${cmd} on both
> (hapus pesan dan tendang anggota)`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antitagsw', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur antitagsw dinonaktifkan.
Tendang: ❌
Hapus: ❌

Gunakan \`${cmd} on option\` untuk mengaktifkan kembali.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang anggota yang tag status grup)

${cmd} on delete
> (hapus pesan tag status)

${cmd} on both
> (hapus pesan dan tendang anggota)

${cmd} off
> (nonaktifkan fitur antitagsw)`);
        }
    }
};