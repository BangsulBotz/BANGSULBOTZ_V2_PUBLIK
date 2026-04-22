import fs from 'fs';
import path from 'path';
import { db as userDb, normalizeJid } from './db_user.js'; 

const dbPath = path.join(process.cwd(), 'database', 'bot_db.json'); 

const loadData = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            const init = { botSettings: { self: false, anticall: true }, trusted: [] };
            fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
            return init;
        }
        return JSON.parse(fs.readFileSync(dbPath));
    } catch (e) {
        console.error("Gagal membaca database, menggunakan template kosong.");
        return { botSettings: { self: false, anticall: true }, trusted: [] };
    }
};

global.botDb = loadData();

global.saveBotDb = () => {
    fs.writeFile(dbPath, JSON.stringify(global.botDb, null, 2), (err) => {
        if (err) console.error("Gagal menyimpan bot_db:", err);
    });
};

export const botDb = {
    getSetting: (key, defaultValue = false) => {
        return global.botDb.botSettings[key] ?? defaultValue;
    },

    updateSetting: (key, value) => {
        global.botDb.botSettings[key] = value;
        global.saveBotDb();
    },

    isTrusted: (jid, command) => {
        if (!jid) return false;
        const target = resolveToPN(jid);
        if (!target) return false;

        return global.botDb.trusted.some(t => 
            t.jid === target && (t.command === '*' || t.command === command)
        );
    },

    addTrusted: (jid, command = '*') => {
        const target = resolveToPN(jid);
        if (!target) return false;
        
        const exists = global.botDb.trusted.some(t => t.jid === target && t.command === command);
        if (!exists) {
            global.botDb.trusted.push({ jid: target, command });
            global.saveBotDb();
        }
        return true;
    }
};

export function resolveToPN(inputJid) {
    if (!inputJid) return null;
    const norm = normalizeJid(inputJid);  

    if (norm.endsWith('@s.whatsapp.net')) return norm;

    if (norm.endsWith('@lid')) {
        try {
            const row = userDb.prepare('SELECT jid FROM users WHERE lid = ?').get(norm);
            if (row && row.jid) {
                return normalizeJid(row.jid);
            }
        } catch (err) {
            console.error('[botDb] Gagal query LID → PN:', err.message);
        }
    }
    return norm;
}
