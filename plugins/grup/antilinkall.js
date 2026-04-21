import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antilinkall',
    alias: ['antilink'],
    description: `Mengaktifkan fitur deteksi semua jenis tautan (URL) dengan sanksi otomatis.

*Cara Penggunaan:*
- \`on\`: Mengaktifkan fitur.
- \`off\`: Menonaktifkan fitur.

*Pilihan Sanksi (Options):*
- \`delete\`: Menghapus pesan yang mengandung link.
- \`kick\`: Mengeluarkan pengirim link.
- \`both\`: Menghapus pesan dan mengeluarkan pengirimnya.

*Contoh:*
- \`.antilinkall on delete\`

*Catatan:* Fitur ini memfilter semua jenis link (Web, Sosmed, dll). Untuk link grup WhatsApp, disarankan menggunakan antilinkgc secara terpisah.`,
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

            setGroupSetting(msg.chat, 'antilinkall', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur antilinkall diaktifkan.
Tendang: ${statusKick}
Hapus: ${statusDelete}

Gunakan salah satu perintah berikut:
${cmd} on ${option === 'kick' ? 'delete' : 'kick'}
> (ubah sanksi ke ${option === 'kick' ? 'hapus pesan' : 'tendang'})

${cmd} on both
> (hapus pesan dan tendang anggota)`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antilinkall', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur antilinkall dinonaktifkan.
Tendang: ❌
Hapus: ❌

Gunakan \`${cmd} on option\` untuk mengaktifkan kembali.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang anggota yang mengirim link)

${cmd} on delete
> (hapus pesan berisi link)

${cmd} on both
> (hapus pesan dan tendang anggota)

${cmd} off
> (nonaktifkan fitur antilinkall)`);
        }
    }
};