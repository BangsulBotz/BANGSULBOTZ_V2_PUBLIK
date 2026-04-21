import { trustedDb } from '../../database/db_user.js';

export default {
    command: 'untrusted',
    alias: ['untrust', 'removetrust', 'hapustrusted', 'rmtrust'],
    description: 'Menghapus akses trusted berdasarkan nomor urut, command (reply), atau semua sekaligus',
    onlyOwner: true,

    async execute(m, sock, args) {
        const query = args[0]?.toLowerCase().trim();

        if (query === 'all') {
            try {
                const result = trustedDb.clear();
                
                if (result.changes === 0) return m.reply('Database trusted memang sudah kosong.');
                
                global.tempTrustedList = [];
                return m.reply(`🗑️ *UNTRUST ALL SUCCESS*\n\nBerhasil menghapus seluruh data user (${result.changes} baris) dari database trusted secara permanen.`);
            } catch (e) {
                return m.reply('Gagal menghapus semua data: ' + e.message);
            }
        }

        let targetJid, targetFeature;

        if (m.quoted && m.quoted.command) {
            targetJid = m.quoted.sender;
            targetFeature = m.quoted.command;
        } 
        else if (!isNaN(parseInt(query))) {
            if (!global.tempTrustedList || global.tempTrustedList.length === 0) {
                return m.reply(`Ketik *${m.prefix}trustlist* dulu untuk melihat daftar nomor urutnya.`);
            }

            const index = parseInt(query, 10);
            if (index < 1 || index > global.tempTrustedList.length) {
                return m.reply(`Nomor urut tidak valid. Masukkan 1 sampai ${global.tempTrustedList.length}`);
            }

            const target = global.tempTrustedList[index - 1];
            targetJid = target.jid;
            targetFeature = target.feature;
        } else {
            return m.reply(`*Format Salah!*\n\n• *Urut:* ${m.prefix}untrust 1\n• *Reply:* Balas pesan user lalu ketik ${m.prefix}untrust\n• *Semua:* ${m.prefix}untrust all`);
        }

        try {
            const result = trustedDb.remove(targetJid, targetFeature);

            if (result.changes > 0) {
                if (global.tempTrustedList) {
                    global.tempTrustedList = global.tempTrustedList.filter(item => !(item.jid === targetJid && item.feature === targetFeature));
                }

                let text = `🗑️ *TRUSTED REMOVED*\n\n`;
                text += `◦  *User:* @${targetJid.split('@')[0]}\n`;
                text += `◦  *Fitur:* \`${targetFeature}\`\n\n`;
                text += `Akses berhasil dicabut.`;

                await sock.sendMessage(m.chat, { text, mentions: [targetJid] }, { quoted: m });
            } else {
                await m.reply('Gagal: Data tidak ditemukan di database.');
            }
        } catch (e) {
            console.error(e);
            await m.reply('Terjadi error: ' + e.message);
        }
    }
};