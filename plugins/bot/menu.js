import config from '../../settings.js';

export default {
    command: 'menu',
    alias: ['allmenu', 'help', 'menuall'],
    description: 'Menampilkan daftar perintah bot.',
    typing: true,

    async execute(m, sock, args, plugins) {
        const usedPrefix = m.prefix;
        const isAllMenu = m.command.includes('all') || (args[0] && args[0].toLowerCase() === 'all');
        const requestedCategory = (args[0] && args[0].toLowerCase() !== 'all') ? args[0].toLowerCase() : null;

        // Font styling helper
        const f = (str) => {
            const input = str ? String(str) : '';
            if (!input) return '';
            const serifBold = {
                a: "𝐚", b: "𝐛", c: "𝐜", d: "𝐝", e: "𝐞", f: "𝐟", g: "𝐠", h: "𝐡", i: "𝐢", j: "𝐣", k: "𝐤", l: "𝐥", m: "𝐦", n: "𝐧", o: "𝐨", p: "𝐩", q: "𝐪", r: "𝐫", s: "𝐬", t: "𝐭", u: "𝐮", v: "𝐯", w: "𝐰", x: "𝐱", y: "𝐲", z: "𝐳",
                A: "𝐀", B: "𝐁", C: "𝐂", D: "𝐃", E: "𝐄", F: "𝐅", G: "𝐆", H: "𝐇", I: "𝐈", J: "𝐉", K: "𝐊", L: "𝐋", M: "𝐌", N: "𝐍", O: "𝐎", P: "𝐏", Q: "𝐐", R: "𝐑", S: "𝐒", T: "𝐓", U: "𝐔", V: "𝐕", W: "𝐖", X: "𝐗", Y: "𝐘", Z: "𝐙",
                "0": "𝟎", "1": "𝟏", "2": "𝟐", "3": "𝟑", "4": "𝟒", "5": "𝟓", "6": "𝟔", "7": "𝟕", "8": "𝟖", "9": "𝟗"
            };
            return input.split('').map(c => serifBold[c] || c).join('');
        };

        const menuData = {};
        const seenCommands = new Set();
        const categories = new Set();

        plugins.forEach((plugin) => {
            const cmd = plugin.command;
            if (!cmd || seenCommands.has(cmd) || plugin.disabled || cmd === 'example') return;

            const category = (plugin.category || 'OTHER').toUpperCase();
            categories.add(category);
            if (!menuData[category]) menuData[category] = [];
            let display = cmd;
            if (plugin.help) display += ` ${plugin.help}`;
            menuData[category].push(display);
            seenCommands.add(cmd);
        });

        const uptime = process.uptime();
        const jam = Math.floor(uptime / 3600);
        const menit = Math.floor((uptime % 3600) / 60);
        const detik = Math.floor(uptime % 60);

        let menuBody = `╔══〔 ${f(config.botName)} 〕═══▧\n`;
        menuBody += `╠  👤 ${f('User')} : @${m.sender.split('@')[0]}\n`;
        menuBody += `╠  🏮 ${f('Owner')} : ${config.owner}@s.whatsapp.net\n`;
        menuBody += `╠  🧬 ${f('Version')} : ${f(config.version || '1.6')}\n`;
        menuBody += `╠  🔮 ${f('Prefix')} : [ ${config.prefixes.join(' ')} ]\n`;
        menuBody += `╠  ⏳ ${f('Uptime')} : ${f(jam + 'h ' + menit + 'm ' + detik + 's')}\n`;
        menuBody += `╚═════════════▧\n\n`;

        if (!requestedCategory && !isAllMenu) {
            menuBody += `▧─『 ${f('KATEGORI MENU')} 』─▧\n`;
            const sortedCats = Array.from(categories).sort();
            for (const cat of sortedCats) {
                menuBody += ` │ ◈ ${usedPrefix}${m.command} ${cat.toLowerCase()}\n`;
            }
            menuBody += `▧═════════════▧\n\nNote: Ketik ${usedPrefix}allmenu untuk melihat semua fitur.`;
        } 
        else if (isAllMenu) {
            const sortedCats = Object.keys(menuData).sort();
            for (const cat of sortedCats) {
                menuBody += `╭─〔 *${f(cat)}* 〕─⊷\n`;
                menuBody += menuData[cat].map(cmd => `│ ◦ ${usedPrefix}${cmd}`).join('\n');
                menuBody += `\n╰───────────⊷\n\n`;
            }
            menuBody += `*Total : ${seenCommands.size} Fitur Terdeteksi*`;
        } 
        else {
            const upperReq = requestedCategory.toUpperCase();
            if (menuData[upperReq]) {
                menuBody += `╭─〔 *${f(upperReq)}* 〕─⊷\n`;
                menuBody += menuData[upperReq].map(cmd => `│ ◦ ${usedPrefix}${cmd}`).join('\n');
                menuBody += `\n╰───────────⊷\n`;
            } else {
                return m.reply(`Kategori *${requestedCategory}* tidak ditemukan.`);
            }
        }

        await sock.sendWithThumbnail(m.chat, {
            text: menuBody,
            title: `${config.botName} Menu`,
            body: `Daftar Perintah Bot - Versi ${config.version}`,
            thumbnailName: config.randomThumbnail,
            faviconName: config.randomFavicon,
            sourceUrl: config.my.gh,
            renderLargerThumbnail: true,
            mentions: [m.sender]
        }, m);
    }
};