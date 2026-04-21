import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..', '..');

export default {
  command: 'addfile',
  alias: ['simpanfile', 'svfile'],
  description: 'Menyimpan media/file apa saja yang direply ke directory tertentu',
  help: '`(reply)`',
  onlyOwner: true,

  async execute(m, sock, args) {
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quoted) {
      return m.reply('Balas (reply) media atau file yang ingin disimpan!');
    }

    const type = Object.keys(quoted)[0];
    const msg = quoted[type];
    
    const allowedMedia = ['imageMessage', 'videoMessage', 'stickerMessage', 'documentMessage', 'audioMessage', 'documentWithCaptionMessage'];
    
    if (!allowedMedia.includes(type) && !msg?.mimetype) {
      return m.reply('Media tidak dikenal atau tidak didukung.');
    }

    const targetFolder = args[0] || './';
    const targetDir = path.resolve(ROOT_DIR, targetFolder);
    
    let fileName = msg?.fileName || msg?.name || '';
    
    if (!fileName) {
      const ext = msg?.mimetype?.split('/')[1]?.split(';')[0] || 'bin';
      fileName = `file_${Date.now()}.${ext}`;
    }

    const fullPath = path.join(targetDir, fileName);

    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (fs.existsSync(fullPath)) {
        const mention = `@${m.sender.split('@')[0]}`;
        const caption = `Mohon maaf ${mention} 🥺
File *${fileName}* sudah ada di directory:
\`${targetFolder}\`

Gunakan nama lain atau hapus file lama terlebih dahulu.`;

        return sock.sendMessage(m.chat, { 
          text: caption, 
          mentions: [m.sender] 
        }, { quoted: m });
      }

      const buffer = await m.quoted.download();
      fs.writeFileSync(fullPath, buffer);

      const successText = `*Berhasil Menyimpan File*

\`Nama:\` ${fileName}
\`Folder:\` ${targetFolder}
\`Mime:\` ${msg?.mimetype || 'unknown'}
\`Size:\` ${(buffer.length / 1024).toFixed(2)} KB

\`Path:\` ${path.relative(ROOT_DIR, fullPath)}`;

      await sock.sendMessage(m.chat, { text: successText }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, {
        text: `Error: ${err.message || 'Gagal menyimpan file'}`
      }, { quoted: m });
    }
  }
};