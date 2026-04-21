import fs from 'fs';
import path from 'path';

export default {
  command: 'getfile',
  alias: ['gf', 'ambilfile', 'sendfile'],
  description: 'Mengirim file dari server bot sebagai document\n\n.getfile <path file>\nContoh: .getfile ./plugins/menu.js',
  help: '`<path file>`',
  typing: true,
  onlyOwner: true,
  async execute(m, sock, args) {
    
    const filePathInput = args.join(' ').trim();
    if (!filePathInput) {
      return sock.sendMessage(m.chat, {
        text: `*Format salah!*\nGunakan: ${m.prefix}${m.command} <path file>\nContoh: ${m.prefix}${m.command} ./plugins/menu.js`
      }, { quoted: m });
    }

    if (filePathInput.includes('..')) {
      return sock.sendMessage(m.chat, { text: '⛔ Penggunaan ".." dilarang untuk keamanan!' }, { quoted: m });
    }

    try {
      const fullPath = path.resolve(process.cwd(), filePathInput);

      if (!fs.existsSync(fullPath)) {
        return sock.sendMessage(m.chat, { text: `❌ Path tidak ditemukan: ${filePathInput}` }, { quoted: m });
      }

      const stat = await fs.promises.stat(fullPath);
      if (!stat.isFile()) {
        return sock.sendMessage(m.chat, { text: `❌ Bukan file: ${filePathInput}` }, { quoted: m });
      }

      const fileName = path.basename(fullPath);
      const mime = 'application/octet-stream'; // generic, WA akan deteksi otomatis

      await sock.sendMessage(m.chat, {
        document: { url: fullPath },
        mimetype: mime,
        fileName: fileName
      }, { quoted: m });

    } catch (err) {
      let errMsg = 'Terjadi error saat mengambil file';
      if (err.code === 'ENOENT') {
        errMsg = `File tidak ditemukan: ${filePathInput}`;
      } else if (err.code === 'EACCES') {
        errMsg = `Tidak punya izin akses file: ${filePathInput}`;
      } else {
        errMsg += `\n${err.message}`;
      }
      await sock.sendMessage(m.chat, { text: `❌ ${errMsg}` }, { quoted: m });
    }
  }
};