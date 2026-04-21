export default {
    command: 'readmore',
    description: 'Membuat teks dengan tombol baca selengkapnya.',
    help: '`<teks1>|<teks2>`',

    typing: true,
    wait: false,

    async execute(m, sock, args) {
        const text = args.join(' ');
        
        if (!text || !text.includes('|')) {
            return m.reply(`Format salah! Gunakan format:\n*${m.prefix}${m.command} teks atas | teks bawah*`);
        }

        const [before, after] = text.split('|').map(v => v.trim());

        if (!before || !after) {
            return m.reply(`Harus ada teks di depan dan di belakang pemisah *|*`);
        }

        const readmore = String.fromCharCode(8206).repeat(4001);

        await sock.sendMessage(m.chat, { 
            text: before + readmore + after 
        }, { quoted: m });
    }
};