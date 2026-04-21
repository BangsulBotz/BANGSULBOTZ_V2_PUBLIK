import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_ROOT = path.join(__dirname, '..', '..', 'plugins');

export default {
  command: 'updateplugins',
  alias: ['upplg', 'updateplugin','uppg'],
  description: 'Memperbarui file plugin yang sudah ada di folder tertentu',
  help: '`<directory>+(reply)`',
  onlyOwner: true,

  async execute(m, sock, args) {
    if (!m.quoted) {
      return m.reply(`Balas (reply) pesan dokumen plugin .js yang ingin diperbarui!`);
    }

    const fileName = m.quoted.msg?.fileName || m.quoted.text?.split('\n')[0] || '';
    
    if (!fileName.endsWith('.js')) {
        return m.reply('File yang kamu balas harus memiliki ekstensi .js');
    }

    if (!args[0]) {
      return m.reply(`Tentukan folder filenya!\nContoh: *${m.prefix}${m.command} owner*`);
    }

    const targetFolder = args[0];
    const fullPath = path.join(PLUGINS_ROOT, targetFolder, fileName);

    try {
      if (!fs.existsSync(fullPath)) {
        return m.reply(`File *${fileName}* tidak ditemukan di folder *${targetFolder}*.\nGunakan \`.addplugins\` untuk menambah file baru.`);
      }

      const buffer = await m.quoted.download();
      fs.writeFileSync(fullPath, buffer);

      const successText = `*Berhasil Memperbarui Plugin*

\`File:\` ${fileName}
\`Directory:\` plugins/${targetFolder}/${fileName}

Plugin telah diperbarui dengan versi terbaru.`;

      await sock.sendMessage(m.chat, { text: successText }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, {
        text: `Error: ${err.message || 'gagal memperbarui plugin'}`
      }, { quoted: m });
    }
  }
};