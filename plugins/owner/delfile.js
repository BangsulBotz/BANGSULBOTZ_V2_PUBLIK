import fs from 'fs';
import path from 'path';
import { WHITELIST } from '../../lib/backup.js';

export default {
  command: 'delfile',
  alias: ['df', 'del', 'hapusfile', 'rm', 'rmdir'],
  description: 'Menghapus file/folder. Mode "all" hanya menghapus di luar whitelist.',
  help: '`<path/all>`',
  onlyOwner: true,
  async execute(m, sock, args) {
    const targetInput = args.join(' ').trim();
    if (!targetInput) {
      return sock.sendMessage(m.chat, {
        text: `*Format salah!*\nGunakan:\n${m.prefix}${m.command} <path>\n${m.prefix}${m.command} all`
      }, { quoted: m });
    }

    const rootDir = process.cwd();

    if (targetInput.toLowerCase() === 'all') {
      try {
        const items = await fs.promises.readdir(rootDir);
        let deletedItems = [];
        let skippedCount = 0;

        for (const item of items) {
          if (WHITELIST.includes(item) || item.endsWith('.zip') || item.endsWith('.rar')) {
            skippedCount++;
            continue;
          }

          const fullItemPath = path.join(rootDir, item);
          const stat = await fs.promises.stat(fullItemPath);
          const emoji = stat.isDirectory() ? '📁' : '📄';
          
          deletedItems.push(`${emoji} ${item}`);

          if (stat.isDirectory()) {
            await fs.promises.rm(fullItemPath, { recursive: true, force: true });
          } else {
            await fs.promises.unlink(fullItemPath);
          }
        }

        let text = `🗑️ *Pembersihan massal (Luar Whitelist) Selesai!*\n\nDihapus (${deletedItems.length} item):\n`;
        text += deletedItems.length === 0 ? '_Tidak ada file sampah ditemukan._\n' : deletedItems.join('\n') + '\n';
        text += `\nDilindungi (Whitelist): ${skippedCount} item`;

        return sock.sendMessage(m.chat, { text }, { quoted: m });
      } catch (err) {
        return sock.sendMessage(m.chat, { text: `❌ Gagal membersihkan: ${err.message}` }, { quoted: m });
      }
    }

    if (targetInput.includes('..')) {
      return sock.sendMessage(m.chat, { text: '⛔ Akses dilarang!' }, { quoted: m });
    }

    try {
      const fullPath = path.resolve(rootDir, targetInput);

      if (!fs.existsSync(fullPath)) {
        return sock.sendMessage(m.chat, { text: `❌ Path tidak ditemukan: ${targetInput}` }, { quoted: m });
      }

      const stat = await fs.promises.stat(fullPath);
      const type = stat.isDirectory() ? 'folder' : 'file';
      const emoji = stat.isDirectory() ? '📁' : '📄';

      if (stat.isDirectory()) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(fullPath);
      }

      await sock.sendMessage(m.chat, {
        text: `✅ Berhasil menghapus ${type}\n${emoji} ${targetInput}\n\n> _Status: Override Whitelist Berhasil_`
      }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, { text: `❌ Gagal: ${err.message}` }, { quoted: m });
    }
  }
};