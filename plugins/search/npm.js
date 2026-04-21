import axios from 'axios';

export default {
    command: 'npm',
    alias: ['npmjs', 'npmsearch'],
    description: 'Mencari informasi package di NPMJS.',
    help: '`<nama package>`',
    typing: true,

    async execute(m, sock, args) {
        const text = args.join(' ') || (m.quoted?.text || '');
        
        if (!text) {
            return m.reply(`⚠️ Masukkan nama package!\nContoh: ${m.prefix}${m.command} axios`);
        }

        try {
            const res = await axios.get(`http://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(text)}`);
            const { objects } = res.data;

            if (!objects || objects.length === 0) {
                return m.reply('❌ Package tidak ditemukan.');
            }

            const result = objects.map(({ package: pkg }) => {
                return `📦 *${pkg.name}* (v${pkg.version})\n🔗 _${pkg.links.npm}_\n📝 _${pkg.description || 'Tidak ada deskripsi.'}_`;
            }).join('\n\n');

            await sock.sendMessage(m.chat, {
                text: `🔎 *NPM Search Results:*\n\n${result}`}, { quoted: m });

        } catch (e) {
            console.error(e);
            await m.reply('❌ Terjadi kesalahan saat mencari package.');
        }
    }
};