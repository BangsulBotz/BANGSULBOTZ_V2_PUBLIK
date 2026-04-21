import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_ROOT = path.join(__dirname, '..', '..', 'plugins');

export default {
  command: 'delplugins',
  alias: ['delp', 'delplg','delplugin','deleteplugin','deleteplugins', 'hapusplugin'],
  description: 'Menghapus file plugin berdasarkan nama command atau alias\n\n' +
                'Contoh:\n' +
                '• .dp crm\n' +
                '• .delplugins downloader',
  onlyOwner: true,
    help: '`<command>`',
  async execute(m, sock, args) {
    if (!args.length) {
      return sock.sendMessage(m.chat, {
        text: `Gunakan: *${m.prefix}${m.command}* <nama/alias>\nContoh:\n${m.prefix}dp crm`
      }, { quoted: m });
    }

    const query = args[0].toLowerCase().trim();

    try {
      const categories = fs.readdirSync(PLUGINS_ROOT, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.') && !dirent.name.startsWith('_'))
        .map(dirent => dirent.name);

      let foundFilePath = null;
      let foundCategory = null;
      let foundFileName = null;

      outer: for (const cat of categories) {
        const catPath = path.join(PLUGINS_ROOT, cat);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
          const fullPath = path.join(catPath, file);
          const fileUrl = `file://${fullPath}`;

          try {
            const mod = await import(`${fileUrl}?update=${Date.now()}`);
            const plugin = mod.default;

            if (!plugin || !plugin.command) continue;

            const match =
              plugin.command.toLowerCase() === query ||
              (plugin.alias && plugin.alias.some(a => a.toLowerCase() === query));

            if (match) {
              foundFilePath = fullPath;
              foundCategory = cat;
              foundFileName = file;
              break outer;
            }
          } catch (importErr) {
            continue;
          }
        }
      }

      if (!foundFilePath) {
        return sock.sendMessage(m.chat, {
          text: `Tidak ditemukan plugin dengan nama/alias *${query}*`
        }, { quoted: m });
      }

      fs.unlinkSync(foundFilePath);

      const caption = `*Berhasil menghapus file plugin*

\`nama file:\` \`${foundFileName}\`
\`directory:\` plugins/${foundCategory}/${foundFileName}`;

      await sock.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, {
        text: `Error: ${err.message || 'gagal menghapus plugin'}`
      }, { quoted: m });
    }
  }
};