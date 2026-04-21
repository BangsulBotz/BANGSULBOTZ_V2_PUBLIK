export default {
    command: 'getpp',
    alias: [ 'fotoprofil'],
    description: 'Ambil foto profil WhatsApp',
    help: '`[reply/tag/nomor]`',
    typing: true,
    async execute(m, sock, args) {
        let targets = new Set();

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentions.length > 0) {
            mentions.forEach(jid => targets.add(jid));
        }

        if (args.length > 0) {
            args.forEach(arg => {
                if (arg.startsWith('@')) {
                    let num = arg.replace(/[^0-9]/g, '');
                    if (num.length > 10) targets.add(`${num}@lid`);
                } else if (/^\d{10,16}$/.test(arg)) {
                    targets.add(`${arg}@s.whatsapp.net`);
                }
            });
        }

        if (targets.size === 0 && m.quoted) {
            targets.add(m.quoted.sender);
        }

        if (targets.size === 0) {
            targets.add(m.sender);
        }

        const targetArray = Array.from(targets);
        const validMedias = [];

        for (const jid of targetArray) {
            try {
                let ppUrl;
                try {
                    ppUrl = await sock.profilePictureUrl(jid, "image");
                } catch {
                    let fallbackJid = jid.split('@')[0] + '@s.whatsapp.net';
                    ppUrl = await sock.profilePictureUrl(fallbackJid, "image");
                }

                if (ppUrl) {
                    validMedias.push({
                        image: { url: ppUrl },
                        caption: `Berhasil mengambil foto profil`,
                        mentions: [jid]
                    });
                }
            } catch {
                validMedias.push({
                    image: { url: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' },
                    caption: `Foto profil @${jid.split('@')[0]} tidak tersedia`,
                    mentions: [jid]
                });
            }
        }

        if (validMedias.length > 1 && typeof sock.sendAlbum === 'function') {
            const albumItems = validMedias.map(item => ({
                image: item.image,
                caption: item.caption
            }));
            await sock.sendAlbum(m.chat, albumItems, { quoted: m });
        } else {
            for (const item of validMedias) {
                await sock.sendMessage(m.chat, item, { quoted: m });
                if (validMedias.length > 1) await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
};
