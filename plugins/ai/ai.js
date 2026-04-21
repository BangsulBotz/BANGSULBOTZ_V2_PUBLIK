import axios from 'axios';

export default {
  command: 'ai',
  alias: ['gpt'],
  description: 'Chat dengan AI (GPT) dengan efek mengetik.',
  help: '`<pertanyaan>`',
  typing: true,

  async execute(m, sock, args) {
    const text = args.join(' ');

    if (!text) {
      return m.reply(`Hai, ada yang bisa dibantu?\n\nContoh: *${m.prefix}${m.command} Halo apa kabar?*`);
    }

    try {
      const response = await axios.post("https://chateverywhere.app/api/chat/", {
        model: {
          id: "gpt-4",
          name: "GPT-4",
          maxLength: 32000,
          tokenLimit: 8000,
        },
        messages: [{ role: "user", content: text }],
        prompt: "jawab lah dengan bahasa yang natural dan humor manusia, jangan terlalu kaku dan jawab lah to the point, ga begitu basa basi, okeey. sertakan reaksi seperti manusia, bisa sedih bisa senang dan reaksi lain nya. boleh kok tambah beberapa emoji tapi ga spam. hanya seperlu nya aja, supaya menampilkan reaksi seperti nyata. pakai gaya bahasa seperti logat bahasa indonesia yaaa",
        temperature: 0.5
      }, {
        headers: {
          "Accept": "*/*",
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 60000
      });

      let result = response.data;
      if (typeof result === 'object') result = JSON.stringify(result);

      const cleanText = result.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();
      if (!cleanText) return m.reply('Tidak ada jawaban dari AI.');

      const words = cleanText.split(' ');
      const { key } = await m.reply('...');

      let currentText = '';
      for (let i = 0; i < words.length; i += 2) {
        currentText += (words[i] || '') + ' ' + (words[i + 1] || '') + ' ';
        await sock.sendMessage(m.chat, { text: currentText.trim(), edit: key });
      }

    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.message || 'Terjadi kesalahan';
      m.reply(`❌ *Gagal terhubung ke AI*\n\nDetail: ${msg}`);
    }
  }
};
