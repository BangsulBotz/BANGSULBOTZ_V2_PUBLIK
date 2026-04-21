import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLUGINS_ROOT = path.join(__dirname, '..', '..', 'plugins');

export default {
  command: 'getplugins',
  alias: ['gp', 'getplg', 'plugin', 'ambilplugin'],
  description: 'Mengirim file plugin berdasarkan nama command atau alias\n\n' +
               'Contoh:\n' +
               '• .gp crm\n' +
               '• .getplugins downloader',
  help:'`<command>`',
  onlyOwner: true,

  async execute(m, sock, args) {
    if (!args.length) {
      return sock.sendMessage(m.chat, {
        text: `Gunakan: *${m.prefix}${m.command}* <nama/alias>\nContoh:\n${m.prefix}gp crm`
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
      let foundAliases = null;

      outer: for (const cat of categories) {
        const catPath = path.join(PLUGINS_ROOT, cat);
        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.js'));

        for (const file of files) {
          const fullPath = path.join(catPath, file);
          const fileUrl = `file://${fullPath}`;

          try {
            const mod = await import(fileUrl);
            const plugin = mod.default;

            if (!plugin || !plugin.command) continue;

            const match =
              plugin.command.toLowerCase() === query ||
              (plugin.alias && plugin.alias.some(a => a.toLowerCase() === query));

            if (match) {
              foundFilePath = fullPath;
              foundCategory = cat;
              foundFileName = file;
              foundAliases = plugin.alias || [];
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

      const aliasText = foundAliases.length ? foundAliases.join('\n- ') : 'tidak ada';

      const caption = `*nama file:* \`${foundFileName}\`

\`directory:\` 
plugins/${foundCategory}/${foundFileName}

\`alias:\`
- ${aliasText}`;

      await sock.sendMessage(m.chat, {
        document: { url: foundFilePath },
        mimetype: 'application/javascript',
        fileName: foundFileName,
        caption: caption
      }, { quoted: m });

    } catch (err) {
      await sock.sendMessage(m.chat, {
        text: `Error: ${err.message || 'gagal mengambil plugin'}`
      }, { quoted: m });
    }
  }
};