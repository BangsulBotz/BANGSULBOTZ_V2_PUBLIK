export default {
    command: 'spamreact',
    alias: ['spamreaction', 'sreact', 'sreaction'],
    description: 'Mengirim banyak reaksi emoji secara acak/urut ke pesan.',
    help: '`<jumlah>/(all)`',
    onlyOwner: true,
    async execute(m, sock, args) {
        const targetKey = m.quoted ? m.quoted.key : m.key;
        let input = args[0]?.toLowerCase();

        if (!input) return m.reply(`Contoh: *${m.prefix}${m.command} 10* atau *${m.prefix}${m.command} all*`);

        let loopCount = input === 'all' ? 100 : parseInt(input);
        
        if (isNaN(loopCount) || loopCount <= 0) return m.reply('Masukkan jumlah angka yang valid!');
        if (loopCount > 10000) loopCount = 10000;

        const emojiRanges = [
            [0x1F600, 0x1F64F],
            [0x1F910, 0x1F930],
            [0x1F680, 0x1F6C0]
        ];

        let allEmojis = [];
        for (const [start, end] of emojiRanges) {
            for (let cp = start; cp <= end; cp++) {
                allEmojis.push(String.fromCodePoint(cp));
            }
        }

        try {
            for (let i = 0; i < loopCount; i++) {
                let emoji = allEmojis[i % allEmojis.length];
                sock.sendReact(m.chat, emoji, targetKey);
            }
        } catch (e) {
            console.error(e);
        }
    }
};