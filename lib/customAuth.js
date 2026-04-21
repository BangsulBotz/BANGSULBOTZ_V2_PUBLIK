import Database from 'better-sqlite3';
import { initAuthCreds, BufferJSON } from 'baileys';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import NodeCache from 'node-cache';

// ==================== CONFIG ====================
const SESSION_DIR = path.join(process.cwd(), 'session');
const DB_PATH = path.join(SESSION_DIR, 'auth.db');

if (!fsSync.existsSync(SESSION_DIR)) {
  fsSync.mkdirSync(SESSION_DIR, { recursive: true });
}

const db = new Database(DB_PATH, { timeout: 10000, verbose: null });

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -32000');
db.pragma('mmap_size = 500000000');
db.pragma('busy_timeout = 8000');

db.exec(`
  CREATE TABLE IF NOT EXISTS auth (
    key TEXT PRIMARY KEY,
    value TEXT
  ) WITHOUT ROWID;
`);

const getStmt = db.prepare('SELECT value FROM auth WHERE key = ?');
const upsertStmt = db.prepare('INSERT OR REPLACE INTO auth (key, value) VALUES (?, ?)');
const deleteStmt = db.prepare('DELETE FROM auth WHERE key = ?');

const keyCache = new NodeCache({
  stdTTL: 3600,
  maxKeys: 5000
});

async function readJsonSafe(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data, BufferJSON.reviver);
  } catch {
    return null;
  }
}

export function useCustomAuthState() {
  let creds = initAuthCreds();

  const credsRow = getStmt.get('creds');
  if (credsRow) {
    try {
      creds = JSON.parse(credsRow.value, BufferJSON.reviver);
    } catch (e) {
      console.error('[customAuth] creds corrupt di DB:', e.message);
    }
  } else {
    const credsFile = path.join(SESSION_DIR, 'creds.json');
    if (fsSync.existsSync(credsFile)) {
      readJsonSafe(credsFile).then(oldCreds => {
        if (oldCreds) {
          creds = oldCreds;
          upsertStmt.run('creds', JSON.stringify(creds, BufferJSON.replacer));
        }
      });
    }
  }

  const get = (key) => {
    const row = getStmt.get(key);
    return row ? JSON.parse(row.value, BufferJSON.reviver) : undefined;
  };

  const set = (key, value) => {
    if (value === undefined) {
      deleteStmt.run(key);
      keyCache.del(key);
    } else {
      upsertStmt.run(key, JSON.stringify(value, BufferJSON.replacer));
      if (key.includes(':')) {
        keyCache.set(key, value);
      }
    }
  };

  const rawKeys = {
    get: (type, ids) => {
      const data = {};
      const missed = [];

      for (const id of ids) {
        const cacheKey = `${type}:${id}`;
        const cached = keyCache.get(cacheKey);
        if (cached !== undefined) {
          data[id] = cached;
        } else {
          missed.push(id);
        }
      }

      if (missed.length === 0) return data;

      const tx = db.transaction(() => {
        for (const id of missed) {
          const cacheKey = `${type}:${id}`;
          const val = get(cacheKey);
          if (val !== undefined) {
            data[id] = val;
            keyCache.set(cacheKey, val);
          }
        }
      });
      tx();

      return data;
    },

    set: (data) => {
      const tx = db.transaction(() => {
        for (const category in data) {
          for (const id in data[category]) {
            set(`${category}:${id}`, data[category][id]);
          }
        }
      });
      tx();
    }
  };

  const state = { creds, keys: rawKeys };

  const saveCreds = () => set('creds', state.creds);

  const invalidateCache = () => {
    keyCache.flushAll();
    console.log('[customAuth] Cache dibersihkan');
  };

  const clearNonCreds = () => {
    const beforeCount = db.prepare("SELECT COUNT(*) as count FROM auth WHERE key != 'creds'").get().count;
    db.prepare("DELETE FROM auth WHERE key != 'creds'").run();
    db.prepare("VACUUM").run();
    keyCache.flushAll();

    return beforeCount;
  };

  return { state, saveCreds, invalidateCache, clearNonCreds };
}