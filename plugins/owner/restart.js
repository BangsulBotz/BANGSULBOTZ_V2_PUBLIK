import fs from 'fs';
import path from 'path';

export default {
  command: 'restart',
  alias: ['restartbot', 'botrs', 'botres', 'resbot'],
  description: 'melakukan `Restart` bot guna untuk me-refresh perubahan pada file/sessions.',
  onlyOwner: true,
  typing: true,
  async execute(m, sock) {
    const trashPath = path.join(process.cwd(), 'sampah');
    const restartFile = path.join(trashPath, 'restart_info.json');
    if (!fs.existsSync(trashPath)) fs.mkdirSync(trashPath);
    const restartData = {
      jid: m.chat,
      time: Date.now()
    };

    try {
      fs.writeFileSync(restartFile, JSON.stringify(restartData, null, 2));
      
      await sock.sendMessage(m.chat, { 
        text: '🔄 *Bot sedang restart...*\nMohon tunggu sekitar 5-10 detik.' 
      }, { quoted: m });
      setTimeout(() => {
        process.exit(0);
      }, 1500);

    } catch (e) {
      console.error(e);
      await m.reply('❌ Gagal membuat file restart info.');
    }
  }
};