import axios from 'axios';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

export default {
    command: 'get',
    alias: ['fetch'],
    description: 'Mengambil data atau media dari URL secara langsung.',
    help: '`<url>`',

    onlyOwner: false,
    wait: true, 

    async execute(m, sock, args) {
        let url = args[0] || '';
        if (!url && m.quoted && m.quoted.text) {
            const urlRegex = /https?:\/\/[^\s<>"']+/gi;
            const urls = m.quoted.text.match(urlRegex);
            if (urls) url = urls[0];
        }

        if (!url || !/^https?:\/\//.test(url)) {
            return m.reply(`Masukkan URL yang valid!\nContoh: ${m.prefix}${m.command} https://example.com/file.mp4`);
        }

        const startTime = performance.now();

        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://www.google.com/',
                    'Connection': 'keep-alive'
                },
                responseType: 'arraybuffer',
                timeout: 30000, 
                maxContentLength: 100 * 1024 * 1024, 
            });

            const contentType = response.headers['content-type'] || '';
            const buffer = Buffer.from(response.data);
            const duration = ((performance.now() - startTime) / 1000).toFixed(2);
            
            let ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
            if (contentType.includes('audio/x-m4a') || url.endsWith('.m4a')) ext = 'm4a';

            const commonCaption = `⏱️ *Durasi Fetch:* ${duration}s\n🌐 *Source:* ${new URL(url).hostname}`;

            if (/json|html|javascript|text|plain/.test(contentType)) {
                let textData = buffer.toString('utf-8');
                if (textData.length > 4000) { // Jika teks terlalu panjang, kirim sebagai file
                    return await sendAsFile(sock, m, buffer, `result.txt`, 'text/plain', commonCaption);
                }
                return m.reply(textData.slice(0, 4000));
            }

            if (/image/.test(contentType)) {
                return await sock.sendMessage(m.chat, { 
                    image: buffer, 
                    caption: commonCaption 
                }, { quoted: m });
            }

            if (/video/.test(contentType)) {
                return await sock.sendMessage(m.chat, { 
                    video: buffer, 
                    caption: commonCaption,
                    mimetype: 'video/mp4'
                }, { quoted: m });
            }

            if (/audio/.test(contentType)) {
                return await sock.sendMessage(m.chat, { 
                    audio: buffer, 
                    mimetype: contentType.includes('mpeg') ? 'audio/mpeg' : 'audio/mp4',
                    ptt: false 
                }, { quoted: m });
            }

            return await sendAsFile(sock, m, buffer, `file_${Date.now()}.${ext}`, contentType, commonCaption);

        } catch (err) {
            console.error(err);
            let errMsg = `❌ *Gagal Fetch!*\n\n` +
                         `*Status:* ${err.response?.status || 'Error'}\n` +
                         `*Pesan:* ${err.message}`;
            
            if (err.message.includes('exceeded')) errMsg += `\n*Catatan:* Ukuran file terlalu besar.`;
            m.reply(errMsg);
        }
    }
};

async function sendAsFile(sock, m, buffer, fileName, mimetype, caption) {
    return await sock.sendMessage(m.chat, {
        document: buffer,
        fileName: fileName,
        mimetype: mimetype,
        caption: caption
    }, { quoted: m });
}