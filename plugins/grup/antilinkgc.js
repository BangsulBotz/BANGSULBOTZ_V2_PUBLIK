import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antilinkgc',
    alias: ['antilinkgroup', 'antigclink'],
    description: `Mengaktifkan fitur deteksi link grup WhatsApp lain dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Hanya menghapus pesan link tersebut.
- \`kick\`: Langsung mengeluarkan pengirim link tanpa menghapus pesan.
- \`both\`: Menghapus pesan sekaligus mengeluarkan pengirimnya.

*Contoh:*
- \`.antilinkgc on delete\` (Sangat disarankan untuk keamanan grup).

*Catatan:* Tautan undangan grup ini sendiri tidak akan terkena sanksi (Izin Otomatis).`,
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

            // Simpan ke database dengan key 'antilinkgc'
            setGroupSetting(msg.chat, 'antilinkgc', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur antilinkgc diaktifkan.
Tendang: ${statusKick}
Hapus: ${statusDelete}

Gunakan salah satu perintah berikut:
${cmd} on ${option === 'kick' ? 'delete' : 'kick'}
> (ubah sanksi ke ${option === 'kick' ? 'hapus pesan' : 'tendang'})

${cmd} on both
> (hapus pesan dan tendang anggota)`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antilinkgc', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur antilinkgc dinonaktifkan.
Tendang: ❌
Hapus: ❌

Gunakan \`${cmd} on option\` untuk mengaktifkan kembali.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang anggota yang mengirim link grup lain)

${cmd} on delete
> (hapus pesan berisi link grup lain)

${cmd} on both
> (hapus pesan dan tendang anggota)

${cmd} off
> (nonaktifkan fitur antilinkgc)`);
        }
    }
};