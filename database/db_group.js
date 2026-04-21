import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'database', 'groups.db');
const db = new Database(dbPath);

// Cache sederhana untuk performa (opsional)
const cache = new Map();

const DEFAULT_ACTION = { status: false, delete: false, kick: false };

const DEFAULT_CONFIG = {
    subject: 'Unknown Group',
    self: 1,
    setinfo: 0,
    welcome: 0,
    antidelete: 0,
    infolabel:0,
    autogemini:0,
    antihidetag: JSON.stringify(DEFAULT_ACTION),
    antilinkall: JSON.stringify(DEFAULT_ACTION),
    antisticker: JSON.stringify(DEFAULT_ACTION),
    antilinkgc: JSON.stringify(DEFAULT_ACTION),
    antibot: JSON.stringify(DEFAULT_ACTION),
    antitagsw: JSON.stringify(DEFAULT_ACTION),
    antitagall: JSON.stringify(DEFAULT_ACTION),
    antiswgc: JSON.stringify(DEFAULT_ACTION)
};

function initDb() {
    db.prepare(`
        CREATE TABLE IF NOT EXISTS groups (
            jid TEXT PRIMARY KEY,
            subject TEXT DEFAULT 'Unknown Group'
        )
    `).run();

    const tableInfo = db.prepare("PRAGMA table_info(groups)").all();
    const existingColumns = tableInfo.map(c => c.name);

    Object.keys(DEFAULT_CONFIG).forEach(key => {
        if (!existingColumns.includes(key)) {
            const defaultValue = typeof DEFAULT_CONFIG[key] === 'string' 
                ? `'${DEFAULT_CONFIG[key]}'` 
                : DEFAULT_CONFIG[key];
            db.prepare(`ALTER TABLE groups ADD COLUMN ${key} DEFAULT ${defaultValue}`).run();
        }
    });
}

initDb();
// FORCE ADD INFOLABEL JIKA BELUM ADA (jalankan setiap start untuk safety)
try {
    const columns = db.prepare("PRAGMA table_info(groups)").all().map(c => c.name);
    if (!columns.includes('infolabel')) {
        db.prepare("ALTER TABLE groups ADD COLUMN infolabel INTEGER DEFAULT 0").run();
        console.log('[DB] Kolom infolabel ditambahkan secara force!');
    } else {
        console.log('[DB] Kolom infolabel sudah ada.');
    }
} catch (e) {
    console.log('[DB] Force add infolabel error:', e.message);
}

export function getGroupSetting(groupJid, key) {
    if (!groupJid?.endsWith('@g.us')) return false;

    // Cek Cache dulu
    if (cache.has(groupJid + key)) return cache.get(groupJid + key);

    let row = db.prepare("SELECT * FROM groups WHERE jid = ?").get(groupJid);

    if (!row) {
        const keys = ['jid', ...Object.keys(DEFAULT_CONFIG)];
        const values = [groupJid, ...Object.values(DEFAULT_CONFIG)];
        const placeholders = keys.map(() => '?').join(',');
        
        db.prepare(`INSERT INTO groups (${keys.join(',')}) VALUES (${placeholders})`).run(...values);
        row = db.prepare("SELECT * FROM groups WHERE jid = ?").get(groupJid);
    }

    let res = row[key];

    // Parsing JSON jika perlu
    if (typeof res === 'string' && res.startsWith('{')) {
        try { res = JSON.parse(res); } catch (e) {}
    } else if (res === 0 || res === 1) {
        res = !!res;
    }

    // Simpan di cache sebentar (misal 5 detik)
    cache.set(groupJid + key, res);
    setTimeout(() => cache.delete(groupJid + key), 5000);

    return res;
}
/**
 * Mengambil nama grup (subject) dari database
 */
export function getGroupName(groupJid) {
    if (!groupJid?.endsWith('@g.us')) return 'Unknown Group';
    const row = db.prepare("SELECT subject FROM groups WHERE jid = ?").get(groupJid);
    return row?.subject || 'Unknown Group';
}

export function setGroupSetting(groupJid, key, value) {
    if (!groupJid?.endsWith('@g.us')) return false;

    const finalValue = (typeof value === 'object') 
        ? JSON.stringify(value) 
        : (typeof value === 'boolean' ? (value ? 1 : 0) : value);

    db.prepare(`UPDATE groups SET ${key} = ? WHERE jid = ?`).run(finalValue, groupJid);
    
    // Hapus cache agar data terbaru dibaca nanti
    cache.delete(groupJid + key);
    return true;
}