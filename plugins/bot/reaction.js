export default {
    command: 'react',
    alias: ['reaction'],
    description: 'Memberikan reaksi emoji ke pesan dengan delay dan limit.',
    help: '`<emoji> (reply)`',
    async execute(m, sock, args) {
        let text = args.join('');
        if (!text) return m.reply(`Silakan masukkan emoji! Contoh: *${m.prefix}${m.command} 👍🔥❤️*`);

        let emojis = text.match(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu);
        if (!emojis) return m.reply('Karakter yang dimasukkan bukan emoji valid.');

        const targetKey = m.quoted ? m.quoted.key : m.key;

        try {
            for (const emoji of emojis) {
                await sock.sendReact(m.chat, emoji, targetKey);
            }
        } catch (e) {
            console.error(e);
        }
    }
};
