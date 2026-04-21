import config from '../../settings.js';
import { getRandomThumb, getRandomFavicon } from '../../database/db_thumbnails.js';

const handler = {
    command: 'owner',
    alias: ['ownerbot', 'botowner'],
    description: 'Menampilkan informasi pemilik bot dalam satu paragraf dengan emoji',
    typing: true,

    async execute(m, sock) {
        const caption = `https://github.com/BangsulBotz\nHalo 👋 @${m.sender.split('@')[0]}, perkenalkan pemilik saya adalah \`${config.ownerName}\` 👨‍💻 yang bisa dihubungi melalui nomor @${config.owner}. Saat ini saya beroperasi sebagai \`${config.botName}\` 🤖 versi \`${config.version}\`. Jika ada keperluan mendesak atau kendala terkait sistem bot, silakan langsung hubungi kontak tersebut ya! ✨`.trim();

        const randomThumb = getRandomThumb();
        const randomFav = getRandomFavicon();

        const extendedText = {
            text: caption,
            matchedText: "https://github.com/BangsulBotz",
            title: `PROFIL DEVELOPER • ${config.botName.toUpperCase()}`,
            previewType: 1,
            inviteLinkGroupTypeV2: 0,
        };

        // Perbaikan thumbnail acak
        if (randomThumb) {
            extendedText.jpegThumbnail       = randomThumb.jpegThumbnail;
            extendedText.thumbnailDirectPath = randomThumb.thumbnailDirectPath;
            extendedText.thumbnailSha256     = randomThumb.thumbnailSha256;
            extendedText.thumbnailEncSha256  = randomThumb.thumbnailEncSha256;
            extendedText.mediaKey            = randomThumb.mediaKey;
            extendedText.mediaKeyTimestamp   = randomThumb.mediaKeyTimestamp;
            extendedText.thumbnailHeight     = randomThumb.thumbnailHeight;
            extendedText.thumbnailWidth      = randomThumb.thumbnailWidth;
        }

        if (randomFav && randomFav.faviconMMSMetadata) {
            extendedText.faviconMMSMetadata = randomFav.faviconMMSMetadata;
        }

        const content = {
            extendedTextMessage: {
                ...extendedText,
                contextInfo: {
                    mentionedJid: [
                        m.sender,
                        config.owner + '@s.whatsapp.net'
                    ],
                    groupMentions: [],
                    statusAttributions: [],
                    stanzaId: m.key?.id || "",
                    participant: m.key?.participant || m.sender,
                    quotedMessage: {
                        conversation: m.body || "owner"
                    },
                    quotedType: 0
                }
            },
            messageContextInfo: {
                threadId: [],
                messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
            }
        };

        await sock.relayMessage(m.chat, content, {});
    }
};

export default handler;