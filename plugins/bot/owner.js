import config from '../../settings.js';

export default {
    command: 'owner',
    alias: ['ownerbot', 'botowner'],
    description: 'Menampilkan informasi pemilik bot dalam satu paragraf dengan emoji',
    typing: true,

    async execute(m, sock) {
        const caption = `Halo 👋 @${m.sender.split('@')[0]}, perkenalkan pemilik saya adalah \`${config.ownerName}\` 👨‍💻 yang bisa dihubungi melalui nomor @${config.owner}. Saat ini saya beroperasi sebagai \`${config.botName}\` 🤖 versi \`${config.version}\`. Jika ada keperluan mendesak atau kendala terkait sistem bot, silakan langsung hubungi kontak tersebut ya! ✨`.trim();

        await sock.sendWithThumbnail(m.chat, {
            text: caption,
            title: `PROFIL DEVELOPER • ${config.botName.toUpperCase()}`,
            body: `Developer & Creator of ${config.botName}`,
            thumbnailName: config.randomThumbnail, 
            faviconName: config.randomFavicon,
            sourceUrl: config.sourceUrl, 
            renderLargerThumbnail: true,
            mentions: [
                m.sender, 
                config.owner + '@s.whatsapp.net'
            ]
        }, m);
    }
};
