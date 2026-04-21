export default {
    command: 'delete',
    alias: ['del'],
    description: 'Menghapus pesan melalui reply atau reaction ❌',
    help: '`(reply)`',
    onlyGroup: true,
    onlyAdmin: true,
    

    async execute(m, sock) {
        if (!m.quoted) return;

        try {
            await sock.sendMessage(m.chat, { 
                delete: {
                    remoteJid: m.chat,
                    fromMe: m.quoted.key.fromMe,
                    id: m.quoted.key.id,
                    participant: m.quoted.key.participant
                } 
            });
        } catch (err) {
            console.error('Gagal hapus pesan:', err);
        }
    }
};