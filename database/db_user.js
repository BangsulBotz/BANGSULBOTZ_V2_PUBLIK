import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import Database from 'better-sqlite3';

const dbDir = path.join(process.cwd(), 'database', 'database');
const dbPath = path.join(dbDir, 'db_user.db');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT 'Unknown',
    lid TEXT,
    status TEXT DEFAULT 'user',
    reason TEXT,
    action_time INTEGER,
    updated_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_lid ON users(lid);
  
  CREATE TABLE IF NOT EXISTS trusted_commands (
    jid TEXT,
    command TEXT,
    added_at INTEGER,
    PRIMARY KEY (jid, command)
  );
`);

const nameCache = new Map();

export function normalizeJid(jid) {
    if (!jid) return jid;
    return jid.split('/')[0].split(':')[0] + (jid.includes('@') ? '' : '@s.whatsapp.net');
}

export function getUserData(identifier) {
    if (!identifier) return null;
    const norm = normalizeJid(identifier);
    try {
        return db.prepare('SELECT * FROM users WHERE jid = ? OR lid = ?').get(norm, norm);
    } catch (e) {
        return null;
    }
}

export const blacklist = {
    add: (jid, reason = 'Tanpa alasan') => {
        const norm = normalizeJid(jid);
        return db.prepare(`
            UPDATE users SET status = 'blacklisted', reason = ?, action_time = ? 
            WHERE jid = ? OR lid = ?
        `).run(reason, Date.now(), norm, norm);
    },
    remove: (jid) => {
        const norm = normalizeJid(jid);
        return db.prepare(`
            UPDATE users SET status = 'user', reason = NULL, action_time = NULL 
            WHERE jid = ? OR lid = ?
        `).run(norm, norm);
    },
    check: (jid) => {
        const norm = normalizeJid(jid);
        const row = db.prepare('SELECT status, reason FROM users WHERE jid = ? OR lid = ?').get(norm, norm);
        return { 
            isBlocked: row?.status === 'blacklisted', 
            reason: row?.reason || null 
        };
    }
};

export const trustedDb = {
    add: (jid, command) => {
        const norm = normalizeJid(jid);
        return db.prepare(`
            INSERT OR REPLACE INTO trusted_commands (jid, command, added_at)
            VALUES (?, ?, ?)
        `).run(norm, command, Date.now());
    },
    remove: (jid, command) => {
        const norm = normalizeJid(jid);
        return db.prepare(`
            DELETE FROM trusted_commands WHERE jid = ? AND command = ?
        `).run(norm, command);
    },
    clear: () => {
        return db.prepare('DELETE FROM trusted_commands').run();
    },
    check: (jid, command) => {
        const norm = normalizeJid(jid);
        const row = db.prepare(`
            SELECT 1 FROM trusted_commands 
            WHERE (jid = ? OR jid = (SELECT jid FROM users WHERE lid = ?)) 
            AND command = ?
        `).get(norm, norm, command);
        return !!row;
    }
};

export function getName(jid) {
    if (!jid) return 'Unknown';
    const norm = normalizeJid(jid);
    if (nameCache.has(norm)) return nameCache.get(norm);
    const row = db.prepare('SELECT name FROM users WHERE jid = ? OR lid = ?').get(norm, norm);
    if (row && row.name !== 'Unknown') {
        nameCache.set(norm, row.name);
        return row.name;
    }
    return 'Unknown';
}

const stmtUpdate = db.prepare(`
    INSERT INTO users (jid, name, lid, updated_at)
    VALUES (?, ?, ?, strftime('%s', 'now'))
    ON CONFLICT(jid) DO UPDATE SET
        name = excluded.name,
        lid = COALESCE(excluded.lid, users.lid),
        updated_at = excluded.updated_at
`);

export function updateFromMessage(key, pushName) {
    if (!pushName || pushName === 'Unknown') return;

    const remoteJid = normalizeJid(key.remoteJid);
    const remoteJidAlt = key.remoteJidAlt ? normalizeJid(key.remoteJidAlt) : null;
    const participantAlt = key.participantAlt ? normalizeJid(key.participantAlt) : null;
    const participant = key.participant ? normalizeJid(key.participant) : null;

    let finalJid = null;
    let finalLid = null;
    const candidates = [remoteJid, remoteJidAlt, participantAlt, participant].filter(Boolean);

    candidates.forEach(id => {
        if (id.endsWith('@s.whatsapp.net') && !finalJid) {
            finalJid = id;
        } else if (id.endsWith('@lid') && !finalLid) {
            finalLid = id;
        }
    });
    
    if (!finalJid) {
        if (finalLid) {
        } else {
            return;
        }
    }

    const cacheKey = finalJid || finalLid;
    if (nameCache.get(cacheKey) === pushName) return;

    try {
        db.prepare(`
            INSERT INTO users (jid, name, lid, updated_at)
            VALUES (?, ?, ?, strftime('%s', 'now'))
            ON CONFLICT(jid) DO UPDATE SET
                name = excluded.name,
                lid = COALESCE(excluded.lid, users.lid),
                updated_at = excluded.updated_at
            WHERE excluded.jid LIKE '%@s.whatsapp.net' OR users.jid IS NULL
        `).run(finalJid, pushName, finalLid);

        if (finalJid) nameCache.set(finalJid, pushName);
        if (finalLid) nameCache.set(finalLid, pushName);
    } catch (e) {
        console.error('Error DB Update:', e);
    }
}

/**
 * Fungsi khusus untuk menyimpan/update data diri bot ke database user
 * Dengan log lengkap untuk monitoring JID & LID bersih.
 */
export function saveBotProfile(botData) {
    const cleanJid = normalizeJid(botData.jid);
    const cleanLid = botData.lid ? normalizeJid(botData.lid) : null;
    const name = botData.name || 'BangsulBot';

    if (!cleanJid || !cleanJid.endsWith('@s.whatsapp.net')) return;

    try {
        const result = db.prepare(`
            INSERT INTO users (jid, name, lid, status, updated_at)
            VALUES (?, ?, ?, 'owner', strftime('%s', 'now'))
            ON CONFLICT(jid) DO UPDATE SET
                name = excluded.name,
                lid = COALESCE(excluded.lid, users.lid),
                status = 'owner',
                updated_at = excluded.updated_at
        `).run(cleanJid, name, cleanLid);

        nameCache.set(cleanJid, name);
        if (cleanLid) nameCache.set(cleanLid, name);
        
        console.log(chalk.black.bgGreen(' DATABASE SYNC SUCCESS '));
        console.log(chalk.cyan('┌─ Name : ') + chalk.white(name));
        console.log(chalk.cyan('├─ JID  : ') + chalk.yellow(cleanJid) + chalk.gray(' (Clean)'));
        console.log(chalk.cyan('├─ LID  : ') + chalk.yellow(cleanLid || 'N/A') + chalk.gray(' (Clean)'));
        console.log(chalk.cyan('└─ Type : ') + chalk.magenta('Bot/Owner Identity'));
        
        if (result.changes > 0) {
            console.log(chalk.gray(`[DB] Data ${result.changes > 0 ? 'diperbarui/dibuat' : 'sudah sama'}.`));
        }

    } catch (e) {
        console.error(chalk.white.bgRed(' DATABASE ERROR '), e.message);
    }
}

export { db };
