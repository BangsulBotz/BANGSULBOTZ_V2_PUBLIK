// --- [ FILTER LOG BUFFER BAILEYS ] ---
import './lib/logger.js';

// --- [ EXTERNAL MODULES ] ---
import v8 from 'v8';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// --- [ LOCAL ] ---
import config from './settings.js';
import { createSocket } from './src/createSocket.js';
import { botDb } from './database/db_bot.js';

// Globals
const pluginsDir = path.join(process.cwd(), 'plugins');
const plugins = new Map();
const msgCache = new Set();

setInterval(() => {
    if (global.gc) global.gc();
}, 1000 * 60 * 1);

async function startBot() {
    try {
        const sock = await createSocket(plugins, pluginsDir, msgCache, botDb);
        console.log(chalk.green.bold('Bot berhasil diinisialisasi.'));
        return sock;
    } catch (err) {
        console.error(chalk.red('Error saat start bot:'), err);
    }
}

// Jalankan Bot
startBot();