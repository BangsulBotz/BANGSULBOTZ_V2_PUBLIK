import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import archiver from 'archiver';
import config from '../settings.js';
import fsPromises from 'fs/promises';

const ROOT = process.cwd();

export const ROOT_FILES = [
  'package.json',
  'index.js',
  'handler.js',
  'settings.js',
  'speed.py',
  'store.js'
];

export const FOLDERS_FULL = [
  'src',
  'lib',
  'media',
  'database',
  'plugins',
  'session'
];

export const IGNORE_LIST = [
  'node_modules',
  '.git',
  '.npm',
  'sampah',
  '.pm2',
  '.cache',
  'package-lock.json'
];

export const WHITELIST = [...ROOT_FILES, ...FOLDERS_FULL, ...IGNORE_LIST];

function shouldIgnore(name, relPath, excludePaths = []) {
  if (IGNORE_LIST.includes(name) || name.endsWith('.zip') || name.endsWith('.rar')) return true;
  return excludePaths.some(ex => relPath.startsWith(ex));
}

async function addFolderToArchive(archive, dir, base, excludePaths = []) {
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relPath = path.join(base, entry.name).replace(/\\/g, '/');
    if (shouldIgnore(entry.name, relPath, excludePaths)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await addFolderToArchive(archive, fullPath, relPath, excludePaths);
    } else {
      archive.file(fullPath, { name: relPath });
    }
  }
}

async function createBackupFile(filePath, excludePaths = []) {
  return new Promise(async (resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    let resolved = false;
    function done(err) {
      if (resolved) return;
      resolved = true;
      if (err) reject(err);
      else resolve();
    }

    output.on('close', () => done());
    output.on('error', done);
    archive.on('error', done);
    archive.pipe(output);

    try {
      for (const file of ROOT_FILES) {
        const filePathRoot = path.join(ROOT, file);
        if (fs.existsSync(filePathRoot)) {
          archive.file(filePathRoot, { name: file });
        }
      }

      for (const folder of FOLDERS_FULL) {
        const folderPath = path.join(ROOT, folder);
        if (fs.existsSync(folderPath)) {
          await addFolderToArchive(archive, folderPath, folder, excludePaths);
        }
      }

      await archive.finalize();
    } catch (err) {
      done(err);
    }
  });
}

export async function sendProjectBackup(sock, options = {}) {
  if (!sock || !config.owner) return;

  const {
    isManual = false,
    triggerReason = 'Backup otomatis',
    customCaption = '',
    excludePaths = []
  } = options;

  const ownerJid = `${config.owner}@s.whatsapp.net`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = isManual ? `backup_manual_${timestamp}.zip` : `backup_auto_${timestamp}.zip`;
  const tempPath = path.join(ROOT, filename);

  try {
    await createBackupFile(tempPath, excludePaths);

    const stats = fs.statSync(tempPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    if (stats.size > 200 * 1024 * 1024) {
      await fsPromises.unlink(tempPath);
      return;
    }

    const caption = customCaption || `*── 「 BACKUP 」 ──*\n\n📅 Waktu: ${new Date().toLocaleString('id-ID')}\n📦 Size: ${fileSizeMB} MB`;

    await sock.sendMessage(ownerJid, {
      document: fs.readFileSync(tempPath),
      mimetype: 'application/zip',
      fileName: filename,
      caption: `${caption}\n\n> _Status: Done_`
    });

    await fsPromises.unlink(tempPath);
    if (config.gc) config.gc();
  } catch (err) {
    if (fs.existsSync(tempPath)) await fsPromises.unlink(tempPath);
  }
}

export async function cleanProject(sock) {
  try {
    await sendProjectBackup(sock, {
      isManual: false,
      triggerReason: 'Cleanup System'
    });

    const items = await fsPromises.readdir(ROOT);

    for (const item of items) {
      if (!WHITELIST.includes(item) && !item.endsWith('.zip')) {
        const fullPath = path.join(ROOT, item);
        try {
          const stats = await fsPromises.stat(fullPath);
          if (stats.isDirectory()) {
            await fsPromises.rm(fullPath, { recursive: true, force: true });
          } else {
            await fsPromises.unlink(fullPath);
          }
        } catch (e) {}
      }
    }

    const ownerJid = `${config.owner}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, { text: '✅ *Cleanup Selesai*\nFile di luar whitelist telah dibersihkan.' });
  } catch (err) {}
}