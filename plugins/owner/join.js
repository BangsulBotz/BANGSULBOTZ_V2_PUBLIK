const isUrl = (url) => {
    return url.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi);
};

import { getRandomThumb } from '../../database/db_thumbnails.js';

export default {
    command: 'join',
    alias: ['join'],
    description: 'Memasukkan bot ke dalam grup melalui link.',
    help: '`<url grup>`',
    onlyOwner: true,
    typing: true,

    async execute(m, sock, args) {
        try {
            const link = args[0] || '';

            if (!link || !isUrl(link) || !link.includes('chat.whatsapp.com')) {
                return m.reply('❌ Masukkan link grup WhatsApp yang valid!');
            }

            const inviteCode = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/)[1];

            await sock.groupAcceptInvite(inviteCode)
                .then(async () => {
                    const randomThumb = getRandomThumb();

                    const extendedText = {
                        text: 'https://github.com/BangsulBotz\n✅ *Berhasil bergabung ke grup!*',
                        matchedText: "https://github.com/BangsulBotz",
                        title: `System Join Success`,
                        previewType: 1,
                        inviteLinkGroupTypeV2: 0,
                    };

                    if (randomThumb) {
                        extendedText.jpegThumbnail       = randomThumb.jpegThumbnail;
                        extendedText.thumbnailDirectPath = randomThumb.thumbnailDirectPath;
                        extendedText.thumbnailSha256     = randomThumb.thumbnailSha256;
                        extendedText.thumbnailEncSha256  = randomThumb.thumbnailEncSha256;
                        extendedText.mediaKey            = randomThumb.mediaKey;
                        extendedText.mediaKeyTimestamp   = randomThumb.mediaKeyTimestamp;
                        extendedText.thumbnailHeight     = randomThumb.thumbnailHeight || 320;
                        extendedText.thumbnailWidth      = randomThumb.thumbnailWidth || 320;
                    }

                    const content = {
                        extendedTextMessage: {
                            ...extendedText,
                            contextInfo: {
                                mentionedJid: [m.sender],
                                groupMentions: [],
                                statusAttributions: [],
                                stanzaId: m.key?.id || "",
                                participant: m.key?.participant || m.sender,
                                quotedMessage: {
                                    conversation: m.body || "join"
                                },
                                quotedType: 0
                            }
                        },
                        messageContextInfo: {
                            threadId: [],
                            messageSecret: "Q0cK7hFXIAyohGHDou6yKS3NYVtnhjgDwLFvo82LSf0="
                        }
                    };

                    await sock.relayMessage(m.chat, content, { quoted: m });
                })
                .catch((err) => {
                    const status = err.data || 500;
                    const msg = status == 400 ? 'Grup tidak ditemukan!' :
                                status == 401 ? 'Bot telah di-kick sebelumnya!' :
                                status == 409 ? 'Bot sudah ada di dalam!' :
                                status == 410 ? 'Link telah di-reset!' :
                                status == 500 ? 'Grup penuh!' : 'Gagal bergabung!';
                    m.reply(`❌ *Error:* ${msg}`);
                });

        } catch (err) {
            console.error(err);
            m.reply('❌ Terjadi kesalahan internal.');
        }
    }
};