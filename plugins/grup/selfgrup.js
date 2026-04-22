import config from '../../settings.js';
import { getGroupSetting, setGroupSetting } from '../../database/db_group.js'; 

export default {
    command: "selfgc",
    alias: ["selfgrup", "selfgroup", "mutegc"],
    onlyOwner: true,
    onlyGroup: true,
    help: '`<on/off>`',
    description: 'Mengatur mode Self di grup (hanya owner yang bisa pakai command)',

    async execute(m, sock, args) {
        try {
            const current = getGroupSetting(m.chat, 'self');

            if (!args[0]) {
                const status = current ? "AKTIF (hanya owner)" : "NON-AKTIF (semua bisa)";
                
                let text = `${config.sourceUrl}\nSelf mode di grup ini: *${status}*\n\n` +
                    `Gunakan:\n` +
                    `${m.prefix}${m.command} \`on\`\n> hanya owner bisa command di grup ini\n` +
                    `${m.prefix}${m.command} \`off\`\n> semua bisa command`;

                return await sock.sendWithThumbnail(m.chat, {
                    text: text,
                    title: `SELF MODE`,
                    body: m.groupMetadata?.subject || config.botName,
                    thumbnailName: config.randomThumbnail,
                    faviconName: config.randomFavicon,
                    sourceUrl: config.sourceUrl,
                    renderLargerThumbnail: true,
                    mentions: [m.sender]
                }, m);
            }

            const input = args[0].toLowerCase();
            let target;

            if (["on", "aktif", "1"].includes(input)) target = true;
            else if (["off", "mati", "0"].includes(input)) target = false;
            else return await m.reply("Gunakan: `on` atau `off`");

            setGroupSetting(m.chat, 'self', target);

            const finalStatus = target ? "AKTIF (hanya owner)" : "NON-AKTIF";
            let text = `${config.sourceUrl}\nSelf mode grup ini sekarang: *${finalStatus}* ✓`;

            return await sock.sendWithThumbnail(m.chat, {
                text: text,
                title: `SELF MODE UPDATED`,
                body: m.groupMetadata?.subject || config.botName,
                thumbnailName: config.randomThumbnail,
                faviconName: config.randomFavicon,
                sourceUrl: config.sourceUrl,
                renderLargerThumbnail: true,
                mentions: [m.sender]
            }, m);

        } catch (err) {
            console.error('Error SelfGC:', err);
            await m.reply('❌ Terjadi kesalahan saat mengatur self mode.');
        }
    }
};
