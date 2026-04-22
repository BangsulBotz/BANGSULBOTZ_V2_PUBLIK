import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import config from '../settings.js';   
import { prepareWAMessageMedia } from 'baileys';

const DB_DIR = path.join(process.cwd(), 'database', 'database');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, 'thumbnails.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS custom_thumbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'thumbnail',
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export const saveThumb = (name, thumbData, type = 'thumbnail') => {
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO custom_thumbs (name, type, data) 
        VALUES (?, ?, ?)
    `);
    return stmt.run(name.toLowerCase(), type, JSON.stringify(thumbData));
};

export const getThumb = (name) => {
    const stmt = db.prepare('SELECT data, type FROM custom_thumbs WHERE name = ?');
    const res = stmt.get(name.toLowerCase());
    if (!res) return null;
    
    const parsed = JSON.parse(res.data);
    return { ...parsed, type: res.type };
};

export const listThumbs = (type = null) => {
    if (type) {
        const stmt = db.prepare('SELECT name FROM custom_thumbs WHERE type = ? ORDER BY name');
        return stmt.all(type);
    }
    const stmt = db.prepare('SELECT name, type FROM custom_thumbs ORDER BY type, name');
    return stmt.all();
};

export const deleteThumb = (name) => {
    const stmt = db.prepare('DELETE FROM custom_thumbs WHERE name = ?');
    const result = stmt.run(name.toLowerCase());
    return result.changes > 0;
};

export const deleteAllByType = (type) => {
    const stmt = db.prepare('DELETE FROM custom_thumbs WHERE type = ?');
    const result = stmt.run(type);
    return result.changes;
};

export const getRandomThumb = () => {
    const all = listThumbs('thumbnail'); 
    if (all.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * all.length);
    const randomName = all[randomIndex].name;
    
    return getThumb(randomName);
};

export const getRandomFavicon = () => {
    const all = listThumbs('favicon');
    if (all.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * all.length);
    const randomName = all[randomIndex].name;
    
    return getThumb(randomName);
};

export const getRandomThumbInfo = () => {
    const all = listThumbs('thumbnail-info'); 
    if (all.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * all.length);
    const randomName = all[randomIndex].name;
    
    return getThumb(randomName);
};

export const getThumbInfo = (name) => {
    const result = getThumb(name.toLowerCase());
    if (result && result.type === 'thumbnail-info') {
        return result;
    }
    return null;
};

export const getRandomThumbnailName = () => {
    const all = listThumbs('thumbnail'); 
    if (all.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * all.length);
    return all[randomIndex].name;
};

export const getRandomFaviconName = () => {
    const all = listThumbs('favicon');
    if (all.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * all.length);
    return all[randomIndex].name;
};

const uploadAndSaveThumb = async (sock, url, name, type = 'thumbnail') => {
    try {
        console.log(`⏳ [${type}] Uploading → ${name}`);

        const { imageMessage } = await prepareWAMessageMedia(
            { image: { url } },
            { 
                upload: sock.waUploadToServer, 
                mediaTypeOverride: "thumbnail-link" 
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

        const result = saveThumb(name.toLowerCase(), thumbData, type);

        if (result.changes > 0 || result.lastInsertRowid) {
            console.log(`✅ Berhasil save ke DB → ${name} | Type: ${type}`);
            return true;
        }
        return false;

    } catch (err) {
        console.error(`❌ Gagal upload & save ${name}:`, err.message);
        return false;
    }
};

export const initThumbnails = async (sock) => {
    if (!sock?.waUploadToServer) {
        console.error('❌ Sock belum ready untuk upload thumbnail');
        return;
    }

    console.log('\n🔄 Mulai auto populate thumbnail ke database SQLite...');

    if (listThumbs('thumbnail').length === 0 && config.thumbnailUrls?.length) {
        for (let i = 0; i < config.thumbnailUrls.length; i++) {
            await uploadAndSaveThumb(sock, config.thumbnailUrls[i], `thumb${i + 1}`, 'thumbnail');
        }
    }

    if (listThumbs('favicon').length === 0 && config.faviconUrl?.length) {
        for (let i = 0; i < config.faviconUrl.length; i++) {
            await uploadAndSaveThumb(sock, config.faviconUrl[i], `favicon${i + 1}`, 'favicon');
        }
    }

    const infoList = [
        { url: config.thumbnail_Blocked,    name: 'blocked' },
        { url: config.thumbnail_Unblocked,  name: 'unblocked' },
        { url: config.thumbnail_botself,    name: 'botself' },
        { url: config.thumbnail_botunself,  name: 'botunself' },
        { url: config.thumbnail_selfgc,     name: 'selfgc' },
        { url: config.thumbnail_grupunself, name: 'grupunself' },
        { url: config.thumbnail_grupset,    name: 'grupset' },
    ];

    if (listThumbs('thumbnail-info').length === 0) {
        for (const item of infoList) {
            if (item.url) {
                await uploadAndSaveThumb(sock, item.url, item.name, 'thumbnail-info');
            }
        }
    }

    console.log('✅ Semua thumbnail berhasil diupload dan disimpan ke SQLite!\n');
};
