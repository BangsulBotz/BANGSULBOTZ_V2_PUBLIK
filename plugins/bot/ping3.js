export default {
  command: 'ping3',
  alias: ['p3'],
  category: 'owner',
  description: 'Cek latency bot dengan 10x edit pesan (daftar ms)',
  onlyOwner: false,
  async execute(m, sock) {
    const sent = await sock.sendMessage(m.chat, {
      text: '🏓 Mulai ping 10x...\nMenghitung latency...'
    }, { quoted: m });

    const results = [];
    const startTotal = process.hrtime.bigint();

    for (let i = 1; i <= 10; i++) {
      const start = process.hrtime.bigint();

      let text = `🏓 Ping ke-${i}/10\n`;
      if (results.length > 0) {
        text += results.map((r, idx) => `${idx + 1}. ${r} ms`).join('\n') + '\n';
      }
      text += `Menunggu edit ke-${i}...`;

      await sock.sendMessage(m.chat, {
        text: text,
        edit: sent.key
      });

      const end = process.hrtime.bigint();
      const latencyNs = end - start;
      const latencyMs = Number(latencyNs / 1_000_000n);

      results.push(latencyMs);
    }

    const endTotal = process.hrtime.bigint();
    const totalMs = Number((endTotal - startTotal) / 1_000_000n);

    const finalText = `🏓 Ping 10x selesai!\n` +
                      `Total waktu: ${totalMs} ms\n\n` +
                      `Daftar latency per edit:\n` +
                      results.map((ms, idx) => `${idx + 1}. ${ms} ms`).join('\n');

    await sock.sendMessage(m.chat, {
      text: finalText,
      edit: sent.key
    });
  }
};
