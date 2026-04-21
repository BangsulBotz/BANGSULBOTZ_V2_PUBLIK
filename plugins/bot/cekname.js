export default {
    command: 'pushname',
    alias: ['pname', 'cekname'],
    description: 'Menampilkan pushname user atau reply.',
    help: '`(reply)`',
    typing: true,

    async execute(m) {
        let response = '';

        if (m.quoted) {
            response = `*SENDER PUSHNAME*
> ${m.pushName || 'Tidak terdeteksi'}

*QUOTED PUSHNAME*
> ${m.quoted.pushName || 'Tidak terdeteksi'}`;
        } else {
            response = `*~*
> ${m.pushName || '~'}`;
        }

        await m.reply(response);
    }
};