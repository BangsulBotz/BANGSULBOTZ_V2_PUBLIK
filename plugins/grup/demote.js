export default {
    command: 'demote',
    alias: ['demote'],
    description: 'Menurunkan admin menjadi member biasa.',
    help: '`<tag/reply>`',

    onlyGroup: true,
    onlyAdmin: true,
    onlyBotAdmin: true,
    typing:true,

    async execute(m, sock, args) {
        const text = args.join(' ');
        let target;

        if (m.quoted) {
            target = m.quoted.sender;
        } else if (m.mentionedJid?.[0]) {
            target = m.mentionedJid[0];
        } else if (text) {
            target = text.replace(/\D/g, '') + (text.length > 15 ? '@lid' : '@s.whatsapp.net');
        }

        if (!target) {
            return m.reply(`*Format salah!*\n\nContoh:\n- Tag target\n- Reply pesan target\n- *${m.prefix}${m.command}* 628xxx`);
        }

        try {
            await sock.groupParticipantsUpdate(m.chat, [target], 'demote');
            await m.reply('Berhasil menurunkan jabatan admin.');
        } catch (err) {
            console.error(err);
            await m.reply('Gagal menurunkan jabatan pengguna.');
        }
    }
};