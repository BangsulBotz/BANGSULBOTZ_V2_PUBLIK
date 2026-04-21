export default {
  command: "welcome",
  alias: ["welcomegc", "wlc"],
  onlyGroup: true,
  onlyAdmin: true,
  help: '`<on/off>`', 
  
  execute: async (m, sock, args) => {
    const { getGroupSetting, setGroupSetting } = await import('../../database/db_group.js');
    const current = getGroupSetting(m.chat, 'welcome') !== false;

    if (!args[0]) {
      const status = current ? "AKTIF (welcome nyala)" : "NON-AKTIF (welcome mati)";
      return await m.reply(
        `Welcome grup ini: *${status}*\n\n` +
        `Gunakan:\n` +
        `${m.prefix}${m.command} \`on\`\n> bot akan kirim gambar welcome & goodbye\n` +
        `${m.prefix}${m.command} \`off\`\n> bot tidak akan kirim welcome & goodbye`
      );
    }

    const input = args[0].toLowerCase();
    let target;
    if (["on", "aktif", "1"].includes(input)) target = true;
    else if (["off", "mati", "0"].includes(input)) target = false;
    else return await m.reply("Gunakan: on / off");

    setGroupSetting(m.chat, 'welcome', target);
    await m.reply(`Welcome grup ini sekarang: *${target ? "AKTIF" : "NON-AKTIF"}* ✓`);
  }
};