import config from '../settings.js';   // sesuaikan path-nya
import { prepareWAMessageMedia } from 'baileys';

// Fungsi utama untuk auto populate DB jika kosong
export const initThumbnails = async (sock) => {
    if (!sock?.waUploadToServer) {
        console.error('Socket belum siap untuk upload thumbnail');
        return;
    }

    console.log('🔄 Memulai inisialisasi thumbnail ke database...');

    // === 1. Thumbnail biasa (type: 'thumbnail') ===
    const existingThumbs = listThumbs('thumbnail');
    if (existingThumbs.length === 0 && config.thumbnailUrls?.length > 0) {
        console.log(`📸 Upload ${config.thumbnailUrls.length} thumbnail biasa...`);
        
        for (let i = 0; i < config.thumbnailUrls.length; i++) {
            const url = config.thumbnailUrls[i];
            const name = `thumb${i + 1}`;

            try {
                const result = await uploadAndSaveThumb(sock, url, name, 'thumbnail');
                if (result) console.log(`✅ Berhasil: ${name}`);
            } catch (e) {
                console.error(`❌ Gagal upload ${name}:`, e.message);
            }
        }
    }

    // === 2. Favicon (type: 'favicon') ===
    const existingFav = listThumbs('favicon');
    if (existingFav.length === 0 && config.faviconUrl?.length > 0) {
        console.log(`🌐 Upload ${config.faviconUrl.length} favicon...`);
        
        for (let i = 0; i < config.faviconUrl.length; i++) {
            const url = config.faviconUrl[i];
            const name = `favicon${i + 1}`;

            try {
                const result = await uploadAndSaveThumb(sock, url, name, 'favicon');
                if (result) console.log(`✅ Berhasil: ${name}`);
            } catch (e) {
                console.error(`❌ Gagal upload ${name}:`, e.message);
            }
        }
    }

    // === 3. Thumbnail Info (type: 'thumbnail-info') ===
    const infoKeys = [
        { key: 'thumbnail_Blocked', name: 'blocked' },
        { key: 'thumbnail_Unblocked', name: 'unblocked' },
        { key: 'thumbnail_botself', name: 'botself' },
        { key: 'thumbnail_botunself', name: 'botunself' },
        { key: 'thumbnail_selfgc', name: 'selfgc' },
        { key: 'thumbnail_grupunself', name: 'grupunself' },
        { key: 'thumbnail_grupset', name: 'grupset' },
        // tambahkan sendiri kalau ada lagi
    ];

    const existingInfo = listThumbs('thumbnail-info');
    if (existingInfo.length === 0) {
        console.log('ℹ️ Upload thumbnail info...');
        
        for (const item of infoKeys) {
            const url = config[item.key];
            if (!url) continue;

            try {
                const result = await uploadAndSaveThumb(sock, url, item.name, 'thumbnail-info');
                if (result) console.log(`✅ Berhasil: thumbnail-info → ${item.name}`);
            } catch (e) {
                console.error(`❌ Gagal upload ${item.name}:`, e.message);
            }
        }
    }

    console.log('✅ Inisialisasi thumbnail selesai!');
};

// Fungsi helper untuk upload + save ke DB
const uploadAndSaveThumb = async (sock, url, name, type = 'thumbnail') => {
    try {
        const { imageMessage } = await prepareWAMessageMedia(
            { image: { url } },
            { 
                upload: sock.waUploadToServer, 
                mediaTypeOverride: "thumbnail-link"   // penting untuk link preview
            }
        );

        const thumbData = {
            jpegThumbnail: imageMessage.jpegThumbnail?.toString('base64') || null,
            thumbnailDirectPath: imageMessage.directPath,
            thumbnailSha256: imageMessage.fileSha256?.toString('base64') || "",
            thumbnailEncSha256: imageMessage.fileEncSha256?.toString('base64') || "",
            mediaKey: imageMessage.mediaKey?.toString('base64') || "",
            mediaKeyTimestamp: imageMessage.mediaKeyTimestamp || Math.floor(Date.now() / 1000),
            thumbnailHeight: imageMessage.height || (type === 'favicon' ? 48 : 736),
            thumbnailWidth: imageMessage.width || (type === 'favicon' ? 48 : 1308),
        };

        // Untuk favicon kita tambahkan faviconMMSMetadata juga (opsional, sesuai kebutuhan wrapper)
        if (type === 'favicon') {
            thumbData.faviconMMSMetadata = {
                thumbnailDirectPath: imageMessage.directPath,
                thumbnailSha256: thumbData.thumbnailSha256,
                thumbnailEncSha256: thumbData.thumbnailEncSha256,
                mediaKey: thumbData.mediaKey,
                mediaKeyTimestamp: thumbData.mediaKeyTimestamp,
                thumbnailHeight: 48,
                thumbnailWidth: 48
            };
        }

        saveThumb(name, thumbData, type);
        return true;
    } catch (err) {
        console.error(`Upload gagal untuk ${name}:`, err);
        return false;
    }
};