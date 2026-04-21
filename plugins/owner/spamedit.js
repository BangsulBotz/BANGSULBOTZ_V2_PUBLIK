export default {
  command: 'spamedit',
  alias: ['spam-edit', 'se'],
  category: 'owner',
  description: 'Spam edit satu pesan dengan angka berurutan sampai target tanpa delay',
  help: '`<target>`',
  onlyOwner: true,
  async execute(m, sock, args) {
    if (args.length < 1) {
      await sock.sendMessage(m.chat, { text: `Format: \`${m.prefix}${m.command} <target>\`\nContoh: \`${m.prefix}${m.command} 100\`` }, { quoted: m });
      return;
    }

    const target = parseInt(args[0]);
    if (isNaN(target) || target < 1 || target > 10000) {
      await sock.sendMessage(m.chat, { text: 'Target harus angka 1–10000' }, { quoted: m });
      return;
    }

    const sent = await sock.sendMessage(m.chat, {
      text: '0'
    }, { quoted: m });

    if (!sent || !sent.key) {
      await sock.sendMessage(m.chat, { text: 'Gagal mengirim pesan awal' }, { quoted: m });
      return;
    }

    const key = sent.key;

    for (let i = 1; i <= target; i++) {
      await sock.sendMessage(m.chat, {
        text: `${i}`,
        edit: key
      });
    }

    await sock.sendMessage(m.chat, {
      text: `Selesai! Telah diedit ${target}×`,
      edit: key
    });
  }
};