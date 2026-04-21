import { prepareWAMessageMedia } from 'baileys';
import { getTopActiveByTime, getOldestMessageTimestamp } from '../../database/db_raw_messages.js';
import { getUserData } from '../../database/db_user.js';
import { getGroupName } from '../../database/db_group.js';

export default {
    command: 'tam',
    alias: ['topactive', 'topmember'],
    description: 'Melihat anggota paling aktif berdasarkan nama di database user (WIB).',
    help: '`<tgl> <bln> / all`',
    group: true,
    typing: true,

    async execute(m, sock, args) {
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        
        const nowMs = Date.now();
        const nowWIB = new Date(nowMs + (7 * 60 * 60 * 1000));
        
        let startTs;
        let usedFullRange = false;
        let tgl = nowWIB.getUTCDate();
        let bln = nowWIB.getUTCMonth();
        let thn = nowWIB.getUTCFullYear();

        if (args[0]?.toLowerCase() === 'all') {
            const oldest = getOldestMessageTimestamp(m.chat);
            if (!oldest) return m.reply('❌ Belum ada data pesan yang terekam di grup ini.');
            startTs = oldest;
            usedFullRange = true;
        } else {
            if (args[0]) {
                const parsedTgl = parseInt(args[0]);
                if (!isNaN(parsedTgl) && parsedTgl >= 1 && parsedTgl <= 31) tgl = parsedTgl;
                else return m.reply('❌ Tanggal tidak valid.');
            }

            if (args[1]) {
                const argMonth = args[1].toLowerCase();
                const monthIndex = monthNames.findIndex(m => m.toLowerCase().startsWith(argMonth));
                if (monthIndex !== -1) {
                    bln = monthIndex;
                } else {
                    const parsedMonth = parseInt(args[1]);
                    if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
                        bln = parsedMonth - 1;
                    } else {
                        return m.reply('❌ Format bulan tidak valid.');
                    }
                }
            }

            if (!args[0] && !args[1]) {
                const secondsPassedToday = (nowWIB.getUTCHours() * 3600) + (nowWIB.getUTCMinutes() * 60) + nowWIB.getUTCSeconds();
                startTs = Math.floor(nowMs / 1000) - secondsPassedToday;
            } else {
                const targetDate = new Date(Date.UTC(thn, bln, tgl, 0, 0, 0));
                targetDate.setTime(targetDate.getTime() - (7 * 60 * 60 * 1000));
                startTs = Math.floor(targetDate.getTime() / 1000);
            }
        }

        const endTs = Math.floor(nowMs / 1000);
        let rawData = getTopActiveByTime(m.chat, startTs, endTs, 100);

        if (rawData.length === 0 && !usedFullRange) {
            const oldestTs = getOldestMessageTimestamp(m.chat);
            if (!oldestTs) return m.reply('❌ Belum ada data pesan yang terekam di grup ini.');

            const dateStr = new Date(oldestTs * 1000 + (7 * 60 * 60 * 1000)).toLocaleString('id-ID', { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
            });
            
            await m.reply(`⚠️ Data tidak ditemukan pada periode tersebut.\nMenampilkan statistik sejak: *${dateStr} WIB*`);
            
            rawData = getTopActiveByTime(m.chat, oldestTs, endTs, 100);
            usedFullRange = true;
        }

        const totalMessages = rawData.reduce((acc, curr) => acc + curr.total, 0);

        const finalData = rawData
            .map(item => {
                const userData = getUserData(item.sender_jid);
                return { ...item, name: userData ? userData.name : null };
            })
            .filter(user => user.name !== null)
            .slice(0, 10);

        const groupName = getGroupName(m.chat);

        let dateRangeStr;
        if (usedFullRange) {
            const firstTs = getOldestMessageTimestamp(m.chat);
            const firstDate = new Date(firstTs * 1000 + (7 * 60 * 60 * 1000));
            dateRangeStr = `${firstDate.getUTCDate()} ${monthNames[firstDate.getUTCMonth()]} ${firstDate.getUTCFullYear()} - Sekarang`;
        } else {
            dateRangeStr = `${tgl} ${monthNames[bln]} ${thn}`;
        }

        let caption = `https://github.com/BangsulBotz\n`;
        caption += `📊 *TOP ACTIVE MEMBER*\n`;
        caption += `📅 *Rentang:* ${dateRangeStr}\n`;
        caption += `📍 *Grup:* \`${groupName}\`\n`;
        caption += `──────────────────\n\n`;

        if (finalData.length === 0) {
            caption += `_Tidak ada user terdaftar yang aktif._`;
        } else {
            caption += finalData.map((user, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                return `${i + 1}. *${user.name}*${medal}\n└  Total: \`${user.total} pesan\``;
            }).join('\n\n');
        }

        caption += `\n\n──────────────────\n`;
        caption += `📈 *Total Chat Keseluruhan:* \`${totalMessages} pesan\``;
        caption += `\n\n> Note: Menampilkan 10 besar user terdaftar.`;

        let thumbData = null;
        try {
            const ppUrl = await sock.profilePictureUrl(m.chat, 'image');
            
            const WAMC = await prepareWAMessageMedia(
                { image: { url: ppUrl } },
                { 
                    upload: sock.waUploadToServer,
                    mediaTypeOverride: "thumbnail-link"
                }
            );

            const { imageMessage } = WAMC;

            if (imageMessage) {
                thumbData = {
                    jpegThumbnail: imageMessage.jpegThumbnail ? imageMessage.jpegThumbnail.toString('base64') : null,
                    thumbnailDirectPath: imageMessage.directPath,
                    thumbnailSha256: imageMessage.fileSha256 ? imageMessage.fileSha256.toString('base64') : "",
                    thumbnailEncSha256: imageMessage.fileEncSha256 ? imageMessage.fileEncSha256.toString('base64') : "",
                    mediaKey: imageMessage.mediaKey ? imageMessage.mediaKey.toString('base64') : "",
                    mediaKeyTimestamp: imageMessage.mediaKeyTimestamp || Date.now(),
                    thumbnailHeight: imageMessage.height || 320,
                    thumbnailWidth: imageMessage.width || 320
                };
            }
        } catch (err) {
            console.error('Gagal mengambil / upload foto profil grup:', err);
           
        }

        const extendedText = {
            text: caption,
            matchedText: "https://github.com/BangsulBotz",
            title: `TOP ACTIVE MEMBER`,
            previewType: 1,
            inviteLinkGroupTypeV2: 0,
        };

        if (thumbData && thumbData.jpegThumbnail) {
            extendedText.jpegThumbnail       = thumbData.jpegThumbnail;
            extendedText.thumbnailDirectPath = thumbData.thumbnailDirectPath;
            extendedText.thumbnailSha256     = thumbData.thumbnailSha256;
            extendedText.thumbnailEncSha256  = thumbData.thumbnailEncSha256;
            extendedText.mediaKey            = thumbData.mediaKey;
            extendedText.mediaKeyTimestamp   = thumbData.mediaKeyTimestamp;
            extendedText.thumbnailHeight     = thumbData.thumbnailHeight;
            extendedText.thumbnailWidth      = thumbData.thumbnailWidth;
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
                        conversation: m.body || "tam"
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
    }
};