import config from '../../settings.js';

export default {
    command: 'help',
    alias: ['bantuan', 'keterangan'],
    description: 'Menampilkan informasi detail tentang sebuah command.',
    help: '`<command>`',
    onlyOwner: false,
    typing: true,
    async execute(m, sock, args, allPlugins) {
        if (!args[0] || args[0].trim() === "") {
            return m.reply(`❌ *SALAH FORMAT*\n\nGunakan: \n${m.prefix}${m.command} <nama command>`);
        }

        const query = args[0].toLowerCase().trim();
        const foundPlugin = allPlugins.get(query) || [...allPlugins.values()].find(p => p.alias && p.alias.includes(query));

        if (!foundPlugin) {
            return m.reply(`🔍 Command *${query}* tidak ditemukan.`);
        }

        const cmdName = foundPlugin.command;
        const aliases = foundPlugin.alias?.length ? foundPlugin.alias.join('\n- ') : 'tidak ada';
        const desc = foundPlugin.description || 'Tidak ada deskripsi.';
        const cat = foundPlugin.category || 'umum';

        let access = [];
        if (foundPlugin.onlyOwner) access.push('Owner Only');
        if (foundPlugin.onlyGroup) access.push('Group Only');
        if (foundPlugin.onlyAdmin) access.push('Admin Only');
        if (foundPlugin.onlyBotAdmin) access.push('Bot Admin Only');
        const accessText = access.length ? access.join(' & ') : 'Semua Orang';

        const text = `📋 BANTUAN COMMAND: \`${cmdName}\`

\`Nama command :\` 
- ${cmdName}

\`Alias:\` 
- ${aliases}
\`\`\`
Kategori : ${cat}
Akses    : ${accessText}\`\`\`

\`Deskripsi:\`
${desc}`.trim();

        await sock.sendWithThumbnail(m.chat, {
            text: text,
            title: `${config.botName} — Info Bot`,
            body: `Detail Command: ${cmdName}`,
            thumbnailName: config.randomThumbnail,
            faviconName: config.randomFavicon,
            sourceUrl: config.sourceUrl,
            renderLargerThumbnail: true,
            mentions: [m.sender]
        }, m);
    }
};