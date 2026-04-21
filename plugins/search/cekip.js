import axios from 'axios';
import chalk from 'chalk';

export default {
    command: 'cekip',
    alias: ['ipinfo', 'whoisip', 'iplookup'],
    description: 'Cek informasi lengkap IP Address atau Domain (Geo, ISP, ASN, Proxy, Hosting, dll).\n\nContoh:\n.cekip 8.8.8.8\n.cekip google.com\n.cekip (cek IP kamu sendiri)',
    help: '`<ip/domain>`',
    typing: true,
    
    async execute(m, sock, args) {
        try {
            let query = args[0]?.trim();
            if (!query) {
                if (m.key.remoteJid?.endsWith('@s.whatsapp.net')) {
                    query = m.key.remoteJid.split('@')[0];
                } else {
                    return m.reply(`❌ Masukkan IP atau Domain!\nContoh: \`${m.prefix}${m.command} 8.8.8.8\` atau \`${m.prefix}${m.command} google.com\``);
                }
            }

            await m.reply(`🔍 Sedang mengecek *${query}*...`);
            
            const { data } = await axios.get(`http://ip-api.com/json/${query}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`);

            if (data.status !== 'success') {
                return m.reply(`❌ Gagal: ${data.message || 'Query tidak ditemukan atau tidak valid'}`);
            }

            const isDomain = query.includes('.') && !/^\d{1,3}(\.\d{1,3}){3}$/.test(query);

            const result = `\`\`\`🌐 ${isDomain ? 'DOMAIN' : 'IP'} Lookup Result

🔎 Query : ${data.query}
${isDomain ? `🔄 Resolved IP : ${data.query}` : ''}

📍 Lokasi
• Benua   : ${data.continent || '-'} (${data.continentCode || '-'})
• Negara  : ${data.country || '-'} (${data.countryCode || '-'})
• Kota    : ${data.city || '-'}
• District: ${data.district || '-'}
• Region  : ${data.regionName || '-'} (${data.region || '-'})
• ZIP     : ${data.zip || '-'}

🕒 Timezone : ${data.timezone || '-'}

🏢 Network Info
• ISP     : ${data.isp || '-'}
• Org     : ${data.org || '-'}
• ASN     : ${data.as || '-'}
• AS Name : ${data.asname || '-'}

🔒 Keamanan & Tipe
• Proxy / VPN : ${data.proxy ? '✅ Ya' : '❌ Tidak'}
• Hosting     : ${data.hosting ? '✅ Ya' : '❌ Tidak'}
• Mobile Data : ${data.mobile ? '✅ Ya' : '❌ Tidak'}

📌 Koordinat : ${data.lat || '-'}, ${data.lon || '-'}\`\`\``.trim();

            const mapsUrl = (data.lat && data.lon) 
                ? `\n🗺️ Google Maps: https://www.google.com/maps?q=${data.lat},${data.lon}` 
                : '';

            await sock.sendMessage(m.chat, {
                text: result + mapsUrl
            }, { quoted: m });

            console.log(chalk.green(`[CEKIP] Sukses cek: ${query}`));

        } catch (error) {
            console.error(chalk.red('[CEKIP ERROR]:'), error.message);
            
            if (error.response?.status === 429) {
                m.reply('❌ Rate limit tercapai. Coba lagi dalam beberapa detik.');
            } else {
                m.reply('❌ Terjadi kesalahan saat mengecek. Coba lagi nanti.');
            }
        }
    }
};
