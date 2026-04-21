import fs from 'fs';
import path from 'path';

export default {
  command: 'listfile',
  alias: ['ls', 'dir', 'listdir', 'cekfolder'],
  description: 'Menampilkan daftar file & folder beserta ukurannya\n\n.listfile <path>\n.listfile → default root project',
  help: '`<directory>`',
  onlyOwner: true,
  async execute(m, sock, args) {
  
    let directoryPath = args.join(' ').trim();
    if (!directoryPath) directoryPath = process.cwd();

    if (directoryPath.includes('..')) {
      return sock.sendMessage(m.chat, { text: '⛔ Penggunaan ".." dilarang untuk keamanan!' }, { quoted: m });
    }

    const sent = await sock.sendMessage(m.chat, {
      text: '🔍 Sedang membaca direktori...'
    }, { quoted: m });

    try {
      const fullPath = path.resolve(process.cwd(), directoryPath);
      const items = await fs.promises.readdir(fullPath);

      let folders = [];
      let files = [];

      const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        const mb = kb / 1024;
        if (mb < 1024) return `${mb.toFixed(1)} MB`;
        const gb = mb / 1024;
        return `${gb.toFixed(2)} GB`;
      };

      const getFolderSize = (folderPath) => {
        let total = 0;
        const entries = fs.readdirSync(folderPath, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(folderPath, entry.name);
          if (entry.isDirectory()) {
            total += getFolderSize(full);
          } else if (entry.isFile()) {
            total += fs.statSync(full).size;
          }
        }
        return total;
      };

      let totalSize = 0;

      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        const stat = await fs.promises.stat(itemPath);

        if (stat.isDirectory()) {
          const size = getFolderSize(itemPath);
          folders.push({ name: item, size: formatSize(size) });
          totalSize += size;
        } else if (stat.isFile()) {
          const size = stat.size;
          files.push({ name: item, size: formatSize(size) });
          totalSize += size;
        }
      }

      let text = `*DAFTAR ISI DIREKTORI*\n${fullPath}\n\n`;
      text += `📁 *Folder* \`(${folders.length})\`\n`;
      if (folders.length === 0) {
        text += 'Tidak ada folder\n';
      } else {
        folders.forEach(f => {
          text += `> ${f.name} \`(${f.size})\`\n`;
        });
      }

      text += `\n📄 *File* \`(${files.length})\`\n`;
      if (files.length === 0) {
        text += 'Tidak ada file\n';
      } else {
        files.forEach(f => {
          text += `> ${f.name} \`(${f.size})\`\n`;
        });
      }

      text += `\n📊 *Total ukuran directory*: ${formatSize(totalSize)}\n`;

      await sock.sendMessage(m.chat, {
        text: text,
        edit: sent.key
      });

    } catch (err) {
      let errMsg = 'Terjadi error saat membaca direktori';
      if (err.code === 'ENOENT') {
        errMsg = `Direktori tidak ditemukan: ${directoryPath}`;
      } else if (err.code === 'EACCES') {
        errMsg = `Tidak punya izin akses ke: ${directoryPath}`;
      } else {
        errMsg += `\n${err.message}`;
      }

      await sock.sendMessage(m.chat, {
        text: `❌ ${errMsg}`,
        edit: sent.key
      });
    }
  }
};