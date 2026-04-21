import { setGroupSetting } from '../../database/db_group.js';

export default {
    command: 'antisticker',
    alias: ['antisstik', 'antistiker'],
    description: 'Mengaktifkan fitur deteksi sticker dengan sanksi tertentu.',
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

            // Simpan ke database
            setGroupSetting(msg.chat, 'antisticker', config);

            const statusKick = config.kick ? '✅' : '❌';
            const statusDelete = config.delete ? '✅' : '❌';

            return msg.reply(`Fitur antisticker diaktifkan.
Tendang: ${statusKick}
Hapus: ${statusDelete}

Gunakan salah satu perintah berikut:
${cmd} on ${option === 'kick' ? 'delete' : 'kick'}
> (ubah sanksi ke ${option === 'kick' ? 'hapus pesan' : 'tendang'})

${cmd} on both
> (hapus pesan dan tendang anggota)`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'antisticker', { status: false, delete: false, kick: false });
            return msg.reply(`Fitur antisticker dinonaktifkan.
Tendang: ❌
Hapus: ❌

Gunakan \`${cmd} on option\` untuk mengaktifkan kembali.`);
        } 
        
        else {
            return msg.reply(`Format salah! Gunakan: 
\`${cmd} <on/off> <option>\`

Contoh:
${cmd} on kick
> (tendang anggota yang mengirim sticker)

${cmd} on delete
> (hapus pesan sticker)

${cmd} on both
> (hapus pesan dan tendang anggota)

${cmd} off
> (nonaktifkan fitur antisticker)`);
        }
    }
};