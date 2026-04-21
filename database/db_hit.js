import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const STORE_DIR = path.join(process.cwd(), 'database', 'database');
const dbPath = path.join(STORE_DIR, 'db_hit.db');

if (!fs.existsSync(STORE_DIR)) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
}

const db = new Database(dbPath, { verbose: () => {} });

try {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feature_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      user_jid_id INTEGER NOT NULL,
      feature TEXT NOT NULL,
      success INTEGER DEFAULT 1,
      hit_time INTEGER NOT NULL DEFAULT (CAST(strftime('%s', 'now') AS INTEGER)),
      FOREIGN KEY (chat_id) REFERENCES chats(id),
      FOREIGN KEY (user_jid_id) REFERENCES chats(id)
    );

    CREATE INDEX IF NOT EXISTS idx_hit_time ON feature_hits(hit_time);
    CREATE INDEX IF NOT EXISTS idx_hit_chat ON feature_hits(chat_id);
  `);
} catch (err) {}

const jidCache = new Map();

function getChatId(jid) {
  if (!jid) return null;
  if (jidCache.has(jid)) return jidCache.get(jid);
  
  try {
    db.prepare('INSERT OR IGNORE INTO chats (jid) VALUES (?)').run(jid);
    const row = db.prepare('SELECT id FROM chats WHERE jid = ?').get(jid);
    
    if (row) {
      jidCache.set(jid, row.id);
      return row.id;
    }
  } catch (err) {}
  
  return null;
}

export function saveFeatureHit(userJid, feature, groupJid = null, success = 1) {
  try {
    const userId = getChatId(userJid);
    if (!userId) return;

    const chatId = groupJid ? getChatId(groupJid) : null;
    const nowSeconds = Math.floor(Date.now() / 1000);

    const stmt = db.prepare(`
      INSERT INTO feature_hits (chat_id, user_jid_id, feature, success, hit_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(chatId, userId, feature, success, nowSeconds);
  } catch (err) {}
}

export function getTopFeatures(limit = 10, startTs, endTs) {
  try {
    const query = `
      SELECT feature, COUNT(*) as total
      FROM feature_hits
      WHERE hit_time >= ? AND hit_time <= ?
      GROUP BY feature
      ORDER BY total DESC
      LIMIT ?
    `;
    return db.prepare(query).all(Number(startTs), Number(endTs), limit);
  } catch (err) {
    return [];
  }
}

export function getOldestHitTimestamp() {
    try {
        const row = db.prepare('SELECT MIN(hit_time) as oldest FROM feature_hits').get();
        return row ? row.oldest : null;
    } catch (err) {
        return null;
    }
}

export { db };