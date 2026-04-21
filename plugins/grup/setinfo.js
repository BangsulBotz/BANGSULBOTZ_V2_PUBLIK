export default {
  command: "setinfo",
  alias: ["infogc"],
  onlyGroup: true,
  onlyAdmin: true,
  onlyBotAdmin: true,
  help: '`<on/off>`', 
  execute: async (m, sock, args) => {
    const { getGroupSetting, setGroupSetting } = await import('../../database/db_group.js');
    const current = getGroupSetting(m.chat, 'setinfo') !== false;

    if (!args[0]) {
      const status = current ? "AKTIF (notif nyala)" : "NON-AKTIF (notif mati)";
      return await m.reply(
        `Notifikasi grup ini: *${status}*\n\n` +
        `Gunakan:\n` +
        `${m.prefix}${m.command} \`on\`\n> bot akan kirim notif jika ada perubahan grup\n` +
        `${m.prefix}${m.command} \`off\`\n> bot akan diam jika ada perubahan grup`
      );
    }

    const input = args[0].toLowerCase();
    let target;
    if (["on", "aktif", "1"].includes(input)) target = true;
    else if (["off", "mati", "0"].includes(input)) target = false;
    else return await m.reply("Gunakan: on / off");

    setGroupSetting(m.chat, 'setinfo', target);
    await m.reply(`Notifikasi grup ini sekarang: *${target ? "AKTIF" : "NON-AKTIF"}* ✓`);
  }
};