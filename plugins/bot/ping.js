export default {
  command: 'ping',
  alias: ['test', 'latensi', 'p','p2','mbut'],
  category: 'owner',
  description: 'Cek latency bot.',
  onlyOwner: false,

  async execute(m, sock) {
    const start = process.hrtime.bigint(); 
    const sent = await sock.sendMessage(m.chat, {
      text: '🏓 Pinging...'
    },{quoted:m});

    const end = process.hrtime.bigint();
    const latencyNs = end - start;
    const latencyMs = Number(latencyNs / 1_000_000n); 
    await sock.sendMessage(m.chat, {
      text: `🏓 Pong! ${latencyMs} ms`,
      edit: sent.key
    });
  }
};