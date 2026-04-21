import { loadPlugins } from '../../lib/loadplugins.js';
import { sendProjectBackup } from '../../lib/backup.js';
import path from 'path';
import chalk from 'chalk';

export default {
    command: 'reload',
    alias: ['rl', 'rld', 'relog'],
    typing: true,
    help: '`<backup>`',
    onlyOwner: true,
    async execute(m, sock, args, plugins) {
        const { key } = await m.reply('⏳ *Memulai proses reload...*');

        try {
            await sock.sendMessage(m.chat, {
                text: '📂 *[1/2]* Memuat ulang folder plugins...',
                edit: key
            });

            const pluginsDir = path.join(process.cwd(), 'plugins');
            const result = await loadPlugins(pluginsDir, async (folderName, count) => {
                await sock.sendMessage(m.chat, {
                    text: `📂 *[1/2]* Memuat plugins...\n\n> Current: \`plugins/${folderName}\`\n> Terdeteksi: ${count} commands`,
                    edit: key
                });
            });

            plugins.clear();
            result.temp.forEach((v, k) => plugins.set(k, v));

            if (global.gc) {
                global.gc();
            }

            console.log(chalk.green(`[RELOAD SUCCESS] Total commands: ${plugins.size}`));

            let report = `✅ *RELOAD SUCCESS*\n`;
            report += `──────────────────\n`;
            report += `📂 *Statistik:*\n`;
            report += `┌ Total: ${result.loaded} plugin aktif\n`;
            report += `├ Skipped: ${result.skipped}\n`;
            report += `└ Errors: ${result.errors}\n\n`;

            if (result.issueDetails && result.issueDetails.length > 0) {
                report += `⚠️ *Detail Masalah:*\n`;
                const errors = result.issueDetails.filter(i => i.type === 'ERROR');
                if (errors.length > 0) {
                    report += `*Critical Errors:*\n`;
                    errors.forEach((err, index) => {
                        const isLast = index === errors.length - 1;
                        report += `${isLast ? '└' : '├'} ❌ *${err.file}*\n`;
                        report += ` └─ _${err.reason}_\n`;
                    });
                }
            } else {
                report += `✨ *Semua plugins sukses dimuat!*`;
            }

            report += `\n\n📦 *[2/2]* Auto backup project (Standard Mode)...`;
            await sock.sendMessage(m.chat, { text: report, edit: key });

            await sendProjectBackup(sock, {
                isManual: true,
                excludePaths: ['database/store'],
                customCaption: `*── 「 AUTO BACKUP RELOAD 」 ──*\n\n` +
                               `👤 Trigger: ${m.pushName || 'Owner'}\n` +
                               `🛠️ Tipe: Standard (No Store)\n` +
                               `📅 Waktu: ${new Date().toLocaleString('id-ID')}`
            });

            report += `\n✅ Backup selesai dikirim ke chat owner!`;
            report += `\n──────────────────\n> 💡 _Pesan ini telah diperbarui secara real-time._`;
            
            await sock.sendMessage(m.chat, { text: report, edit: key });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(m.chat, { text: `❌ *FATAL ERROR*\n\n${err.message}`, edit: key });
        }
    }
};