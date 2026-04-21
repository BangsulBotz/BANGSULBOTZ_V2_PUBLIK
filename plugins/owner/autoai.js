import { setGroupSetting, getGroupSetting } from '../../database/db_group.js';

export default {
    command: 'autoai',
    alias: ['autogemini', 'aigemini'],
    description: 'Mengaktifkan atau menonaktifkan Auto Gemini (balas otomatis saat reply pesan bot)',
    help: '<on/off>',
    onlyOwner:true,
    onlyGroup: true,
    typing: true,

    execute: async (msg, sock, args) => {
        const action = args[0]?.toLowerCase();
        const cmd = `${msg.prefix}${msg.command}`;

        if (action === 'on') {
            setGroupSetting(msg.chat, 'autogemini', 1);
            return msg.reply(`✅ *AUTO AI / AUTO GEMINI* telah **diaktifkan** di grup ini.\n\nSekarang jika ada yang reply pesan bot, Gemini akan otomatis menjawab.`);
        } 
        
        else if (action === 'off') {
            setGroupSetting(msg.chat, 'autogemini', 0);
            return msg.reply(`❌ *AUTO AI / AUTO GEMINI* telah **dimatikan** di grup ini.`);
        } 
        
        else {
            const current = getGroupSetting(msg.chat, 'autogemini');
            const isActive = (typeof current === 'number') ? current === 1 : 
                           (typeof current === 'object' && current?.status === true);

            const status = isActive ? '✅ AKTIF' : '❌ MATI';

            return msg.reply(`*── 「 AUTO AI 」 ──*\n\nStatus saat ini: ${status}\n\nGunakan:\n\`${cmd} on\` → Mengaktifkan\n\`${cmd} off\` → Menonaktifkan`);
        }
    }
};