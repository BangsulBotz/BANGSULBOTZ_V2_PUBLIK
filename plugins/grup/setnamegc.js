export default {
    command: 'setnamegrup',
    alias: ['setnamegc', 'setsubject', 'setsubjectgc'],
    description: 'Mengubah nama grup.',
    help: '`<teks/reply>`',
    onlyGroup: true,
    onlyAdmin: true,
    onlyBotAdmin: true,
    typing: true,
    message_done: true, 

    async execute(m, sock, args) {
        const text = args.join(' ') || (m.quoted ? m.quoted.text : '');

        if (!text) {
            return m.reply(
                `*Format salah!*\n` +
                `Gunakan: \`${m.prefix}${m.command} <teks>\`\n` +
                `Contoh: \`${m.prefix}${m.command} Grup Baru\``
            );
        }

        if (text.length > 25) return m.reply('❌ Maksimal 25 karakter!');

        try {
            await sock.groupUpdateSubject(m.chat, text);
        } catch (err) {
            throw err;
        }
    }
};