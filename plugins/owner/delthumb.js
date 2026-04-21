import { getThumb, listThumbs, deleteThumb } from '../../database/db_thumbnails.js';

export default {
    command: 'deletethumb',
    alias: ['delthumb', 'hapusthumb', 'removethumb', 'deletethumbnail'],
    description: 'Hapus thumbnail atau thumbnail-info dari database',
    help: '`<nama>`',
    onlyOwner: true,
    typing: true,
    wait: true,

    async execute(m, sock, args) {
        const name = args[0]?.toLowerCase().trim();

        if (!name) {
            return await m.reply(`*Format Salah!*\n\nGunakan: ${m.prefix}${m.command} <nama>\nContoh: ${m.prefix}${m.command} grupset`);
        }

        const data = getThumb(name);

        if (!data) {
            return await this.replyNotFound(m, name);
        }

        if (data.type === 'favicon') {
            return await m.reply(`❌ Tidak bisa menghapus favicon!\nNama: *"${name}"* adalah tipe favicon.`);
        }

        const deleted = deleteThumb(name);

        if (deleted) {
            const tipe = data.type === 'thumbnail' ? 'Thumbnail Biasa' : 'Thumbnail Info (V2)';
            await m.reply(`✅ *Berhasil dihapus!*\n\nNama : *${name}*\nTipe : ${tipe}`);
        } else {
            await m.reply(`❌ Gagal menghapus thumbnail dengan nama *"${name}"*.`);
        }
    },

    async replyNotFound(m, name) {
        const allItems = listThumbs();

        let msg = `❌ Thumbnail dengan nama *"${name}"* tidak ditemukan.\n\n`;

        if (allItems.length === 0) {
            msg += `Database thumbnail masih kosong.`;
        } else {
            const available = allItems.filter(item => {
                const d = getThumb(item.name);
                return d && d.type !== 'favicon';
            });

            if (available.length > 0) {
                msg += `*Daftar Thumbnail yang tersedia:*\n\n`;
                
                available.forEach((item, i) => {
                    const d = getThumb(item.name);
                    const tipe = d.type === 'thumbnail' ? '(biasa)' : '(info V2)';
                    msg += `${i + 1}. \`${item.name}\` ${tipe}\n`;
                });
            } else {
                msg += `Tidak ada thumbnail yang bisa dihapus.`;
            }
        }

        return await m.reply(msg);
    }
};