import { normalizeJid } from '../../handler.js';
import { getMessagesByJid } from '../../database/db_raw_messages.js';

export default {
  command: 'listchat',
  alias: ['listpesan', 'listmsg', 'lihatpesan', 'history'],
  description: 'List semua pesan user di chat ini (dari store DB) → kirim file JSON',
  help: '`<tag/reply>`',
  onlyOwner: true,

  async execute(m, sock) {
    const args = m.body.split(/ +/).slice(1);
    let targetJid = null;

    if (m.mentionedJid?.length > 0) {
      targetJid = m.mentionedJid[0];
    } else if (m.quoted) {
      targetJid = m.quoted.sender;
    } else if (args.length >= 1) {
      let input = args[0].replace(/[^0-9]/g, '');
      if (input.startsWith('62') || input.startsWith('0')) {
        input = input.replace(/^0/, '62');
        targetJid = input + '@s.whatsapp.net';
      }
    }

    if (!targetJid) {
      return m.reply('Cara: .listchat [nomor HP / tag @user / reply pesan]');
    }

    const normalizedTarget = normalizeJid(targetJid);
    const chatJid = m.chat;
    const messages = getMessagesByJid(chatJid, 9999);

    const userMessages = messages.filter(msg => {
      const sender = msg.fullRaw.key.participant || msg.fullRaw.key.remoteJid;
      return normalizeJid(sender) === normalizedTarget;
    });

    if (userMessages.length === 0) {
      return m.reply(`Tidak ada pesan dari ${normalizedTarget.split('@')[0]} di chat ini`);
    }

    const data = {
      chatJid,
      targetJid: normalizedTarget,
      totalMessages: userMessages.length,
      messages: userMessages.map(msg => ({
        order: msg.order,
        timestamp: msg.timestamp,
        pushName: msg.pushName,
        text: msg.fullRaw.message?.conversation || 
              msg.fullRaw.message?.extendedTextMessage?.text || 
              '[Media/Other]',
        fullRaw: msg.fullRaw
      }))
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const fileName = `listchat-${normalizedTarget.split('@')[0]}.json`;

    await sock.sendMessage(m.chat, {
      document: Buffer.from(jsonStr),
      mimetype: 'application/json',
      fileName,
      caption: `✅ *LIST CHAT BERHASIL*\n\n` +
               `• Chat : ${chatJid}\n` +
               `• User : ${normalizedTarget}\n` +
               `• Total : ${userMessages.length} pesan`
    }, { quoted: m });
  }
};