import fs from 'fs';
import path from 'path';

const isUrl = (str) => {
    const regex = /^(https?:\/\/[^\s$]+)/i;
    return regex.exec(str)?.[0] || null;
};

const saveRawJson = (jsonData, source = 'tiktok') => {
    try {
        const dir = path.join(process.cwd(), 'sampah');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const safeSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
        let index = 1;
        let filename = `api-${safeSource}-${index}.json`;
        let fullPath = path.join(dir, filename);

        while (fs.existsSync(fullPath)) {
            index++;
            filename = `api-${safeSource}-${index}.json`;
            fullPath = path.join(dir, filename);
        }

        fs.writeFileSync(fullPath, JSON.stringify(jsonData, null, 2), 'utf8');
    } catch (err) {
    }
};

export default {
    command: 'tiktok',
    alias: ['tt', 'ttdl', 'ttvideo', 'ttmp4', 'ttmp3', 'tiktokdl', 'tiktokvideo', 'tiktokmp4'],
    description: `*TikTok Downloader*
Mengunduh video (no watermark / watermark), slideshow gambar, dan audio MP3.

Cara pakai:
\`.tiktok <link tiktok>\`

Contoh:
\`.tiktok https://www.tiktok.com/@username/video/123456789\``,
    help: '`<url tiktok>`',
    typing: true,
    wait: true,

    async execute(m, sock, args) {
        if (!args.length) {
            return m.reply(`Kirim link TikTok.\nContoh:\n${m.prefix}${m.command} https://www.tiktok.com/@user/video/123456789`);
        }

        const url = isUrl(args.join(' '));
        if (!url || !url.includes('tiktok.com')) {
            return m.reply(`Link tidak valid. Pastikan dari TikTok.`);
        }
        const apiUrl = 'https://www.tikwm.com/api/';
        const params = { url, hd: 1 };

        let apiData;
        try {
            const res = await fetch(apiUrl + '?' + new URLSearchParams(params).toString(), { timeout: 20000 });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            apiData = await res.json();
            if (apiData.code !== 0) {
                throw new Error(apiData.msg || 'API error');
            }
        } catch (err) {
            return m.reply(`Gagal mengambil data TikTok.\nCoba lagi atau link bermasalah.\n\nDetail: ${err.message}`);
        }

        saveRawJson(apiData);

        const res = apiData.data;
        if (!res) return m.reply('Data tidak ditemukan. Video mungkin private/hapus.');

        const caption = `TikTok • ${res.author?.nickname || 'Unknown'}
Judul: ${res.title || 'No title'}
❤️ Likes: ${res.digg_count?.toLocaleString() || 0}
💬 Komentar: ${res.comment_count?.toLocaleString() || 0}
🔗 Dibagikan: ${res.share_count?.toLocaleString() || 0}
📅 ${new Date(res.create_time * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`;

        let success = false;
        const medias = [];

        if (res.images && res.images.length > 0) {
            res.images.forEach(img => {
                medias.push({ type: 'image', url: img });
            });
        } else {
            if (res.play) medias.push({ type: 'video', url: res.play, quality: 'HD No WM' });
        }

        if (medias.length > 0) {
            const validMedias = [];
            for (const media of medias) {
                try {
                    const head = await fetch(media.url, { method: 'HEAD', timeout: 8000 });
                    if (head.ok) validMedias.push(media);
                } catch {}
            }

            if (validMedias.length > 0) {
                if (validMedias.length === 1) {
                    const media = validMedias[0];
                    const isVideo = media.type === 'video';
                    await sock.sendMessage(m.chat, {
                        [isVideo ? 'video' : 'image']: { url: media.url },
                        caption: caption + (isVideo ? `\n\n🎥 ${media.quality || 'Video'}` : '\n\n🖼️ Gambar'),
                        mimetype: isVideo ? 'video/mp4' : undefined
                    }, { quoted: m });
                    success = true;
                } else if (typeof sock.sendAlbum === 'function') {
                    try {
                        const albumItems = validMedias.map((media, idx) => {
                            const isVideo = media.type === 'video';
                            return {
                                [isVideo ? 'video' : 'image']: { url: media.url },
                                caption: idx === 0 ? caption + `\n\nAlbum (${validMedias.length} media)` : ''
                            };
                        });

                        await sock.sendAlbum(m.chat, albumItems, { quoted: m });
                        success = true;
                    } catch (err) {
                    }
                }

                if (!success) {
                    for (let i = 0; i < validMedias.length; i++) {
                        const media = validMedias[i];
                        const isVideo = media.type === 'video';
                        const cap = i === 0 ? caption + `\n\n${isVideo ? 'Video' : 'Gambar'} ${i+1}/${validMedias.length}` : `${isVideo ? 'Video' : 'Gambar'} ${i+1}/${validMedias.length}`;

                        await sock.sendMessage(m.chat, {
                            [isVideo ? 'video' : 'image']: { url: media.url },
                            caption: cap,
                            mimetype: isVideo ? 'video/mp4' : undefined
                        }, { quoted: m });

                        await new Promise(r => setTimeout(r, 800));
                    }
                    success = true;
                }
            }
        }

        if (res.music || res.music_info?.play) {
            const audioUrl = res.music || res.music_info?.play;
            const audioTitle = res.music_info?.title || 'TikTok Original Sound';
            const audioAuthor = res.music_info?.author || 'Unknown';

            try {
                await sock.sendMessage(m.chat, {
                    audio: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${audioTitle}.mp3`
                }, { quoted: m });

                await sock.sendMessage(m.chat, {
                    document: { url: audioUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${audioTitle}.mp3`,
                    caption: `🎵 *Audio TikTok*\n\n📌 *Judul:* ${audioTitle}\n👤 *Author:* ${audioAuthor}`
                }, { quoted: m });

            } catch (err) {
                await m.reply('Audio ditemukan tapi gagal dikirim.');
            }
        }

        if (!success) {
            await m.reply('Tidak ada media yang bisa dikirim.\nCoba link lain atau cek koneksi.');
        } else {
            await sock.sendReact(m.chat, '✅', m.key);
        }
    }
};