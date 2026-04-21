import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_ROOT = path.join(__dirname, '..', '..', 'plugins');

export default {
  command: 'addplugins',
  alias: ['addplg', 'addplugin', 'tambahplugins', 'tambahplugin'],
  description: 'Menyimpan file plugin baru ke folder tertentu dengan cara membalas (reply) dokumen js',
  help: '`<directory>+(reply)`',
  onlyOwner: true,

  async execute(m, sock, args) {
    if (!m.quoted) {
      return m.reply(`Balas (reply) pesan dokumen plugin .js yang ingin disimpan!`);
    }

    const fileName = m.quoted.msg?.fileName || m.quoted.text?.split('\n')[0] || `plugin_${Date.now()}.js`;
    
    if (!fileName.endsWith('.js')) {
        return m.reply('File yang kamu balas harus memiliki ekstensi .js');
    }

    if (!args[0]) {
      return m.reply(`Tentukan folder penyimpanannya!\nContoh: *${m.prefix}${m.command} owner*`);
    }

    const targetFolder = args[0];
    const targetDir = path.join(PLUGINS_ROOT, targetFolder);
    const fullPath = path.join(targetDir, fileName);

    try {
      if (fs.existsSync(fullPath)) {
        const mention = `@${m.sender.split('@')[0]}`;
        const existingPath = `plugins/${targetFolder}/${fileName}`;
        const caption = `mohon maaf yaa ${mention} 🥺
file: *${fileName}* sudah tersedia di directory:
\`./${existingPath}\`

kalau kamu mau memperbarui, silahkan gunakan perintah:
\`.updateplugins ${targetFolder} + (reply)\` 

terima kasih. 🤗🤗`;

        return sock.sendMessage(m.chat, { 
          text: caption, 
          mentions: [m.sender] 
        }, { quoted: m });
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const buffer = await m.quoted.download();
      fs.writeFileSync(fullPath, buffer);

      const successText = `*Berhasil Menambah Plugin*

\`File:\` ${fileName}
\`Folder:\` plugins/${targetFolder}
\`Path:\` plugins/${targetFolder}/${fileName}

Gunakan \`.getplugins <command>\` untuk mengecek file tersebut.`;

      await sock.sendMessage(m.chat, { text: successText }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, {
        text: `Error: ${err.message || 'gagal menyimpan plugin'}`
      }, { quoted: m });
    }
  }
};