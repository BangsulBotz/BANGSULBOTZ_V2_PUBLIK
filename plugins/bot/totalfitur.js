export default {
    command: 'totalfitur',
    alias: ['fiturtotal', 'totalf'],
    description: 'Menghitung total fitur yang aktif dari plugin.',
    typing: true,

    async execute(m, sock, args, plugins) {
        try {
            const menuData = {};
            const seenCommands = new Set();
            let totalFitur = 0;

            plugins.forEach((plugin) => {
                const cmd = plugin.command;
                
                if (!cmd || seenCommands.has(cmd) || plugin.disabled || cmd === 'example') return; 

                const category = (plugin.category || 'OTHER').toUpperCase();
                
                if (!menuData[category]) menuData[category] = 0;
                
                menuData[category]++;
                seenCommands.add(cmd);
                totalFitur++;
            });

            const sortedCategories = Object.keys(menuData).sort();

            const barisjudul = '╔═〇';
            const barisfitur = '╠» 📂';
            const penutup    = '╚══════════════════〇';

            let caption = `${barisjudul} *STATISTIK FITUR BOT*\n`;
            
            for (const cat of sortedCategories) {
                caption += `${barisfitur} ${cat} : \`${menuData[cat]} fitur\`\n`;
            }

            caption += `${penutup}\n\n`;
            caption += `📊 *Total Plugin Terdeteksi:* ${totalFitur}\n`;
            caption += `✨ *Status:* Active & Optimized`;

            await m.reply(caption);

        } catch (err) {
            console.error('Error TotalFitur:', err);
            m.reply(`*Terjadi kesalahan:* ${err.message}`);
        }
    }
};