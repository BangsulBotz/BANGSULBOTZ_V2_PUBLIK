import { getThumb, listThumbs, deleteThumb } from '../../database/db_thumbnails.js';

export default {
    command: 'delfavicon',
    alias: ['delicon', 'deleteicon', 'hapusicon', 'deletefavicon', 'hapusfavicon', 'delfav'],
    description: 'Hapus favicon dari database',
    help: '`<nama>`',
    onlyOwner: true,
    typing: true,
    wait: true,

    async execute(m, sock, args) {
        const name = args[0]?.toLowerCase().trim();

        if (!name) {
            return await m.reply(`*Format Salah!*\n\nGunakan: ${m.prefix}${m.command} <nama>\nContoh: ${m.prefix}${m.command} youtube`);
        }

        const data = getThumb(name);

        if (!data || data.type !== 'favicon') {
            const allItems = listThumbs();
            const favicons = allItems.filter(item => {
                const d = getThumb(item.name);
                return d && d.type === 'favicon';
            });

            let msg = `❌ Favicon dengan nama *"${name}"* tidak ditemukan.\n\n`;

            if (favicons.length === 0) {
                msg += `Database favicon masih kosong.`;
            } else {
                msg += `*Daftar Favicon yang tersedia:*\n\n`;
                favicons.forEach((item, i) => {
                    msg += `${i + 1}. ${item.name}\n`;
                });
            }
            return await m.reply(msg);
        }

        const deleted = deleteThumb(name);

        if (deleted) {
            await m.reply(`✅ *Berhasil dihapus!*\nFavicon dengan nama *"${name}"* telah dihapus dari database.`);
        } else {
            await m.reply(`❌ Gagal menghapus favicon *"${name}"*.`);
        }
    }
};