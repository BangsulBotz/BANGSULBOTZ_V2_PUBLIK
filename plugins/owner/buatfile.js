import fs from 'fs';
import path from 'path';

export default {
  command: 'buatfile',
  alias: ['mkfile', 'newfile', 'nf'],
  description: 'Membuat file baru dari teks yang direply.',
  help: '`<path/nama>`',
  onlyOwner: true,
  async execute(m, sock, args) {
    
    if (!m.quoted) return m.reply('❌ Reply pesan teks yang ingin dijadikan isi file!');
    if (!args[0]) return m.reply(`❌ Masukkan path/nama file!\nContoh: ${m.prefix}${m.command} ./folder/test.js`);

    const content = m.quoted.text || m.quoted.caption || m.quoted.message?.conversation || 
                    m.quoted.message?.extendedTextMessage?.text || '';

    if (!content.trim()) return m.reply('❌ Teks reply kosong!');

    const fullPathInput = args[0].trim();
    if (fullPathInput.includes('..')) return m.reply('⛔ Akses dilarang!');

    const resolvedPath = path.resolve(process.cwd(), fullPathInput);
    const directory = path.dirname(resolvedPath);
    const fileName = path.basename(resolvedPath);

    const protectedNames = ['package.json', 'index.js', 'settings.js', 'handler.js', '.env'];
    if (protectedNames.includes(fileName.toLowerCase())) return m.reply('⛔ File ini dilindungi!');

    try {
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      if (fs.existsSync(resolvedPath)) {
        return m.reply(`⚠️ File sudah ada di: ${fullPathInput}`);
      }

      await fs.promises.writeFile(resolvedPath, content, 'utf-8');

      await m.reply(`✅ *File Berhasil!*
◦ *Path:* ${fullPathInput}
◦ *Dir:* ${path.relative(process.cwd(), directory) || './'}
◦ *Size:* ${content.length} bytes`);

    } catch (err) {
      await m.reply(`❌ Gagal: ${err.message}`);
    }
  }
};