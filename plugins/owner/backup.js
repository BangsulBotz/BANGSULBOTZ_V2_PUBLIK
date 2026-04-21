import { sendProjectBackup } from '../../lib/backup.js';
import config from '../../settings.js';

export default {
  command: 'backup',
  alias: ['getsc', 'getscript', 'backupproject'],
  description: 'Membuat backup project',
  onlyOwner: true,
  typing: true,
  async execute(m, sock) {
    if (!config.owner) {
      return sock.sendMessage(m.chat, { text: '❌ Owner belum dikonfigurasi' }, { quoted: m });
    }

    const args = m.text.trim().split(/ +/).slice(1);
    const isFull = args[0]?.toLowerCase() === 'full';
    const exclude = isFull ? [] : ['database/store'];

    let statusMsg;
    try {
      const modeText = isFull ? '📦 *MODE: FULL*' : '📄 *MODE: STANDARD* (Exclude database/store)';
      
      statusMsg = await sock.sendMessage(m.chat, {
        text: `⏳ *Membuat backup project...*\n${modeText}\n\n_Mohon tunggu sebentar..._`
      }, { quoted: m });

      await sendProjectBackup(sock, {
        isManual: true,
        excludePaths: exclude,
        customCaption: `*── 「 BACKUP PROJECT 」 ──*\n\n` +
                       `👤 Pengirim: ${m.pushName || 'Owner'}\n` +
                       `🛠️ Tipe: ${isFull ? 'Full' : 'Standard'}\n` +
                       `📅 Waktu: ${new Date().toLocaleString('id-ID')}`
      });

      await sock.sendMessage(m.chat, {
        text: `✅ *Backup Berhasil!*\n\nFile ZIP telah dikirim ke chat pribadi owner.`,
        edit: statusMsg.key
      });

    } catch (err) {
      const errText = `❌ *Gagal membuat backup:*\n\n${err.message || err}`;
      if (statusMsg) {
        await sock.sendMessage(m.chat, { text: errText, edit: statusMsg.key });
      } else {
        await sock.sendMessage(m.chat, { text: errText }, { quoted: m });
      }
    }
  }
};