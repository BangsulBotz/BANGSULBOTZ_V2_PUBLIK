import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { pathToFileURL } from 'url';

export async function loadPlugins(dir, onProgress = null) {
    const tempPlugins = new Map();
    let loadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let issueDetails = [];

    try {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        const relativeDir = path.relative(path.join(process.cwd(), 'plugins'), dir) || 'umum';

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                const subResult = await loadPlugins(fullPath, onProgress);

                subResult.temp.forEach((v, k) => {
                    if (!tempPlugins.has(k)) tempPlugins.set(k, v);
                });

                loadedCount += subResult.loaded;
                skippedCount += subResult.skipped;
                errorCount += subResult.errors;

                if (subResult.issueDetails) {
                    issueDetails.push(...subResult.issueDetails);
                }
            }
            else if (entry.isFile() && entry.name.endsWith('.js')) {
                try {
                    const fileUrl = pathToFileURL(fullPath).href;
                    const stats = await fs.promises.stat(fullPath);
                    const module = await import(`${fileUrl}?v=${stats.mtimeMs}`);
                    const plugin = module.default;

                    if (plugin && typeof plugin.command === 'string' && typeof plugin.execute === 'function') {
                        const cmdLower = plugin.command.toLowerCase().trim();
                        plugin.category = relativeDir.replace(/\\/g, '/');

                        if (cmdLower && !tempPlugins.has(cmdLower)) {
                            tempPlugins.set(cmdLower, plugin);

                            if (Array.isArray(plugin.alias)) {
                                plugin.alias.forEach(alias => {
                                    const al = alias.toLowerCase().trim();
                                    if (al && !tempPlugins.has(al)) tempPlugins.set(al, plugin);
                                });
                            }
                            loadedCount++;
                        }
                    } else {
                        skippedCount++;
                        issueDetails.push({
                            type: 'SKIP',
                            file: entry.name,
                            folder: relativeDir,
                            reason: 'Export default bukan plugin valid (missing command/execute)'
                        });
                    }
                } catch (err) {
                    errorCount++;
                    issueDetails.push({
                        type: 'ERROR',
                        file: entry.name,
                        folder: relativeDir,
                        reason: err.message
                    });
                }
            }
        }

        if (onProgress) {
            await onProgress(relativeDir, loadedCount);
        }

        if (issueDetails.filter(i => i.folder === relativeDir).length === 0 && loadedCount > 0) {
            console.log(chalk.blue(`[LOADER] `) + chalk.cyan(`${relativeDir}`) + chalk.green(` -> All plugins ready.`));
        }

        const localIssues = issueDetails.filter(i => i.folder === relativeDir);
        if (localIssues.length > 0) {
            console.log(chalk.blue(`[LOADER] `) + chalk.yellow(`${relativeDir}`) + chalk.white(` (Loaded: ${loadedCount})`));
            localIssues.forEach(iss => {
                const icon = iss.type === 'ERROR' ? chalk.red('  ❌ ') : chalk.yellow('  ⚠️ ');
                const label = iss.type === 'ERROR' ? chalk.bgRed.white(` ${iss.type} `) : chalk.bgYellow.black(` ${iss.type} `);
                console.log(`${icon}${label} ${chalk.white(iss.file)}`);
                console.log(chalk.gray(`      └─ Masalah: ${iss.reason}`));
            });
            console.log(chalk.gray('──────────────────────────────────────────────────'));
        }

        return {
            temp: tempPlugins,
            loaded: loadedCount,
            skipped: skippedCount,
            errors: errorCount,
            issueDetails: issueDetails
        };

    } catch (err) {
        console.error(chalk.red(`[FATAL ERROR IN LOADER]`), err);
        return { temp: new Map(), loaded: 0, skipped: 0, errors: 1, issueDetails: [] };
    }
}