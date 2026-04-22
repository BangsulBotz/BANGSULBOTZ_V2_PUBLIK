import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { proto } from 'baileys';

const STORE_DIR = path.join(process.cwd(), 'database', 'store');
const dbPath = path.join(STORE_DIR, 'raw_message.db');

if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });

const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  
  CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jid TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS raw_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    msg_id TEXT UNIQUE NOT NULL,
    timestamp INTEGER NOT NULL,
    raw_bin BLOB NOT NULL, 
    FOREIGN KEY (chat_id) REFERENCES chats(id)
  );
`);

const tableInfo = db.prepare("PRAGMA table_info(raw_messages)").all();
const columns = tableInfo.map(c => c.name);

if (!columns.includes('sender_jid')) {
    db.exec(`ALTER TABLE raw_messages ADD COLUMN sender_jid TEXT NOT NULL DEFAULT 'unknown'`);
}
if (!columns.includes('msg_type')) {
    db.exec(`ALTER TABLE raw_messages ADD COLUMN msg_type TEXT DEFAULT 'unknown'`);
}

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_msg_id ON raw_messages(msg_id);
  CREATE INDEX IF NOT EXISTS idx_chat_ts ON raw_messages(chat_id, timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_stats ON raw_messages(chat_id, sender_jid, msg_type);
`);

const jidCache = new Map();

function getChatId(jid) {
    if (jidCache.has(jid)) return jidCache.get(jid);
    db.prepare('INSERT OR IGNORE INTO chats (jid) VALUES (?)').run(jid);
    const row = db.prepare('SELECT id FROM chats WHERE jid = ?').get(jid);
    if (row) {
        jidCache.set(jid, row.id);
        return row.id;
    }
    return null;
}

function getMessageType(rawMsg) {
    if (!rawMsg.message) return 'unknown';
    const type = Object.keys(rawMsg.message)[0];
    if (type === 'senderKeyDistributionMessage' && Object.keys(rawMsg.message).length > 1) {
        return Object.keys(rawMsg.message)[1];
    }
    return type || 'unknown';
}


export function saveRawMessage(rawMsg) {
    if (!rawMsg?.key?.remoteJid || !rawMsg?.key?.id) return null;
    
    const chatId = getChatId(rawMsg.key.remoteJid);
    const msgId = rawMsg.key.id;
    const ts = Number(rawMsg.messageTimestamp) || Math.floor(Date.now() / 1000);
    const sender = rawMsg.key.participant || rawMsg.key.remoteJid;
    const type = getMessageType(rawMsg);

    let finalBuffer;
    try {
        const cleanMsg = proto.WebMessageInfo.fromObject(rawMsg);
        finalBuffer = proto.WebMessageInfo.encode(cleanMsg).finish();
    } catch (err) {
        finalBuffer = Buffer.from(JSON.stringify(rawMsg));
    }

    try {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO raw_messages (chat_id, msg_id, sender_jid, msg_type, timestamp, raw_bin)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(chatId, msgId, sender, type, ts, finalBuffer);
        
        if (result.changes > 0) return result.lastInsertRowid;
        
        const existing = db.prepare('SELECT id FROM raw_messages WHERE msg_id = ?').get(msgId);
        return existing?.id || null;
    } catch (err) {
        console.error('[DB FATAL SAVE ERROR]', err.message);
        return null;
    }
}

export function getMessageByOrder(orderNumber) {
    const row = db.prepare(`
        SELECT rm.raw_bin, c.jid 
        FROM raw_messages rm
        JOIN chats c ON rm.chat_id = c.id
        WHERE rm.id = ?
    `).get(orderNumber);

    if (!row) return null;
    try {
        let raw;
        try { raw = proto.WebMessageInfo.decode(row.raw_bin); }
        catch { raw = JSON.parse(row.raw_bin.toString()); }
        if (!raw.key.remoteJid) raw.key.remoteJid = row.jid;
        return raw;
    } catch (e) { return null; }
}

export function getRawMessageById(messageId) {
    const row = db.prepare(`
        SELECT rm.raw_bin, c.jid 
        FROM raw_messages rm
        JOIN chats c ON rm.chat_id = c.id
        WHERE rm.msg_id = ?
    `).get(messageId);

    if (!row) return null;
    try {
        let decoded;
        try { decoded = proto.WebMessageInfo.decode(row.raw_bin); }
        catch { decoded = JSON.parse(row.raw_bin.toString()); }
        return { rawObj: decoded, chatJid: row.jid };
    } catch (e) { return null; }
}

export function getMessagesByJid(jid, limit = 1000) {
    const chatId = getChatId(jid);
    if (!chatId) return [];
    const rows = db.prepare(`
        SELECT id, timestamp, raw_bin FROM raw_messages 
        WHERE chat_id = ? ORDER BY timestamp DESC LIMIT ?
    `).all(chatId, limit);

    return rows.map(row => {
        try {
            let decoded;
            try { decoded = proto.WebMessageInfo.decode(row.raw_bin); }
            catch { decoded = JSON.parse(row.raw_bin.toString()); }
            return {
                order: row.id,
                timestamp: row.timestamp,
                pushName: decoded.pushName || 'Unknown',
                fullRaw: decoded
            };
        } catch (e) { return null; }
    }).filter(msg => msg !== null);
}


export function getTopActive(jid, limit = 10) {
    const chatId = getChatId(jid);
    if (!chatId) return [];
    return db.prepare(`
        SELECT sender_jid, COUNT(*) as total FROM raw_messages 
        WHERE chat_id = ? GROUP BY sender_jid ORDER BY total DESC LIMIT ?
    `).all(chatId, limit);
}

export function getUserWrapped(jid, senderJid) {
    const chatId = getChatId(jid);
    if (!chatId) return [];
    return db.prepare(`
        SELECT msg_type, COUNT(*) as count FROM raw_messages 
        WHERE chat_id = ? AND sender_jid = ? GROUP BY msg_type ORDER BY count DESC
    `).all(chatId, senderJid);
}


export function optimizeDatabase() {
    try {
        db.exec('VACUUM');
        console.log('[DB] Database Optimized.');
    } catch (err) { console.error('[DB OPTIMIZE ERROR]', err.message); }
}

export function pruneMessages(days = 30) {
    const cutoff = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
    const result = db.prepare('DELETE FROM raw_messages WHERE timestamp < ?').run(cutoff);
    db.exec('VACUUM');
    return result.changes;
}

export function getTopActiveByTime(jid, startTs, endTs, limit = 10) {
    const chatId = getChatId(jid);
    if (!chatId) return [];

    return db.prepare(`
        SELECT sender_jid, COUNT(*) as total 
        FROM raw_messages 
        WHERE chat_id = ? AND timestamp >= ? AND timestamp <= ?
        GROUP BY sender_jid 
        ORDER BY total DESC 
        LIMIT ?
    `).all(chatId, startTs, endTs, limit);
}

export function getOldestMessageTimestamp(jid) {
    const chatId = getChatId(jid);
    if (!chatId) return null;
    const row = db.prepare('SELECT MIN(timestamp) as ts FROM raw_messages WHERE chat_id = ?').get(chatId);
    return row?.ts || null;
}

export { db };
