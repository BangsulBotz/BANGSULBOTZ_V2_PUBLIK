import { GoogleGenAI } from "@google/genai";
import { downloadMediaMessage } from "baileys";
import chalk from 'chalk';
import apiKeys from '../../settings.js';

export default {
    command: 'gemini',
    alias: ['googleai', 'gm'],
    description: 'Chat dengan Gemini Flash (Support Gambar + Sticker + Video + Audio).',
    help: '`<pertanyaan>`',
    typing: true,

    async execute(m, sock, args) {
        let text = args.join(' ').trim();

        const contextInfo = m.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.quotedMessage;
        const quotedSender = contextInfo?.participant || contextInfo?.remoteJid;

        let quotedText = "";
        let mediaMessage = null;
        let isReply = false;
        let isSticker = false;
        let isVideo = false;
        let isAudio = false;
        let isVoiceNote = false; 

        // ================== DETEKSI MEDIA ==================
        if (m.message?.imageMessage) {
            mediaMessage = m.message.imageMessage;
            text = m.message.imageMessage.caption || text;
        } 
        else if (m.message?.stickerMessage) {
            mediaMessage = m.message.stickerMessage;
            isSticker = true;
        } 
        else if (m.message?.videoMessage) {
            mediaMessage = m.message.videoMessage;
            isVideo = true;
            text = m.message.videoMessage.caption || text;
        } 
        else if (m.message?.audioMessage) {
            mediaMessage = m.message.audioMessage;
            isAudio = true;
            isVoiceNote = m.message.audioMessage.ptt === true;
        } 
        else if (m.message?.documentMessage && m.message.documentMessage.mimetype?.startsWith("audio/")) {
            mediaMessage = m.message.documentMessage;
            isAudio = true;
        } 
        else if (quoted) {
            isReply = true;

            if (quoted.stickerMessage) {
                mediaMessage = quoted.stickerMessage;
                isSticker = true;
            } 
            else if (quoted.imageMessage) {
                mediaMessage = quoted.imageMessage;
            } 
            else if (quoted.videoMessage) {
                mediaMessage = quoted.videoMessage;
                isVideo = true;
            } 
            else if (quoted.audioMessage) {
                mediaMessage = quoted.audioMessage;
                isAudio = true;
                isVoiceNote = quoted.audioMessage.ptt === true;  
            } 
            else if (quoted.documentMessage && quoted.documentMessage.mimetype?.startsWith("audio/")) {
                mediaMessage = quoted.documentMessage;
                isAudio = true;
            }

            quotedText = quoted.conversation || 
                        quoted.extendedTextMessage?.text || 
                        quoted.imageMessage?.caption || 
                        quoted.videoMessage?.caption || 
                        quoted.stickerMessage?.caption || 
                        quoted.audioMessage?.caption ||
                        quoted.documentMessage?.caption || "";
        }

        if (!text && (m.text || m.body)) {
            text = (m.text || m.body).trim();
        }

        let reactionNote = "";
        if (isSticker || m.message?.stickerMessage || (m.quoted?.stickerMessage)) {
            isSticker = true;
            mediaMessage = mediaMessage || m.message?.stickerMessage || m.quoted?.stickerMessage;
            reactionNote = "Ini adalah STICKER REAKSI dari user.";
            if (!text) text = reactionNote;
        }

        if (!text && !mediaMessage) {
            text = "(User hanya reply tanpa teks tambahan)";
        }

        try {
            const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
            const genAI = new GoogleGenAI({ apiKey });

            const systemInstruction = `Kamu adalah asisten ramah dan santai berbahasa Indonesia gaul.

ATURAN PENTING:
- Jika ada "reply:" di atas → pengguna sedang reply pesan seseorang.
- Ketika kamu ingin menyapa, memanggil, atau merujuk ke pengguna yang sedang mengirim pesan ini, gunakan **\${nama}**.
- Ketika kamu ingin merujuk ke orang yang pesannya di-reply, gunakan **\${nama_reply}**.
- Contoh yang benar:
  - "Halo \${nama}! 👋"
  - "\${nama}, mau ngapain hari ini?"
  - "Wah \${nama}, pesan yang kamu reply dari \${nama_reply} tadi lucu banget 😆"
- JANGAN gunakan nama asli, nomor, @..., atau teks lain selain \${nama} dan \${nama_reply}.
- Kalau ada reply → pakai \${nama} minimal sekali di awal jawaban, dan sebut juga \${nama_reply}.
- Kalau kirim pesan bold cukup pakai *teks* saja.

ATURAN KHUSUS AUDIO / VOICE NOTE:
- Jika ada audio (ada_audio: true atau isAudio: true), kamu HARUS mentranskrip isi audio tersebut terlebih dahulu dengan akurat.
- Setelah ditranskrip, jawab secara natural dan santai seperti sedang diajak ngobrol biasa.
- Jika audio adalah voice note pendek (is_voice_note: true), respons langsung seperti obrolan sehari-hari.
- Jika user hanya mengirim audio tanpa teks tambahan, anggap itu sebagai pesan suara dan jawab sesuai isinya.
- Jika transkripsi kurang jelas, boleh bilang "Suara agak kurang jelas nih, bisa ulangi?" tapi tetap coba jawab sebaik mungkin.

ATURAN KHUSUS STICKER:
- Jika user reply dengan STICKER (is_sticker: true), itu adalah reaksi visual dari user.
- Langsung tanggapi jangan cuma balas "haha" atau "sedih", pahami konteks reaksi stickernya dan sambungkan dengan percakapan sebelumnya.

FORMAT JAWABAN:
seandainya kamu mau menjawab point dan isi point, gunakan format seperti ini, contoh:
*point*
> point ini adalah bla bla blaa..

Sekarang jawab dengan mengikuti semua aturan di atas.`;



            const contextData = {
                user_sekarang: m.pushName,
                pesan_user: text,
                is_replying: isReply,
                teks_yang_direply: quotedText || null,
                ada_gambar: !!mediaMessage && !isVideo && !isAudio && !isSticker,
                ada_video: isVideo,
                ada_audio: isAudio,
                is_voice_note: isVoiceNote,
                is_sticker: isSticker,
                reaction_note: reactionNote || null,
                waktu: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
            };

            const promptText = `DATA KONTEKS: ${JSON.stringify(contextData)}\n\nUser berkata: ${text}`;

            const contents = [];

            if (mediaMessage) {
                try {
                    let buffer;

                    if (isReply && quoted) {
                        let mediaType = "imageMessage";
                        if (isSticker) mediaType = "stickerMessage";
                        else if (isVideo) mediaType = "videoMessage";
                        else if (isAudio) mediaType = "audioMessage";

                        const reconstructMsg = { message: { [mediaType]: quoted[mediaType] } };

                        buffer = await downloadMediaMessage(reconstructMsg, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    } else {
                        buffer = await downloadMediaMessage(m, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
                    }

                    const base64Media = buffer.toString('base64');
                    let mimeType = "image/jpeg";

                    if (isSticker) mimeType = "image/webp";
                    else if (isVideo) mimeType = mediaMessage.mimetype || "video/mp4";
                    else if (isAudio) {
                        mimeType = mediaMessage.mimetype || (isVoiceNote ? "audio/ogg; codecs=opus" : "audio/mpeg");
                    }

                    contents.push({ inlineData: { mimeType, data: base64Media } });

                    if (isAudio) {
                        console.log(chalk.cyan(`[AUDIO] Dikirim ke Gemini → MIME: ${mimeType} | PTT: ${isVoiceNote} | Size: ${buffer.length} bytes`));
                    }

                } catch (e) {
                    console.error("Gagal download media:", e.message);
                }
            }

            contents.push({ text: promptText });

            const result = await genAI.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: contents,
                config: { systemInstruction }
            });

            let responseText = result.text || "Maaf, aku ga bisa proses audio sekarang.";

            // Replace placeholder nama
            const mentions = [];
            if (responseText.includes("${nama}")) {
                responseText = responseText.replace(/\${nama}/g, `@${m.sender.split("@")[0]}`);
                mentions.push(m.sender);
            }
            if (responseText.includes("${nama_reply}") && quotedSender) {
                responseText = responseText.replace(/\${nama_reply}/g, `@${quotedSender.split("@")[0]}`);
                mentions.push(quotedSender);
            }

            responseText = responseText.replace(/\*\*(.*?)\*\*/g, '*$1*').trim();

            await sock.sendMessage(m.chat, { 
                text: responseText, 
                mentions: mentions 
            }, { quoted: m });

        } catch (err) {
            console.error("DEBUG ERROR GEMINI:", err);
            m.reply(`❌ *Gemini Error:* ${err.message}`);
        }
    }
};

// ================== FUNGSI KHUSUS UNTUK AUTO AI ==================
export async function runAutoGemini(m, sock) {
    try {
        console.log(chalk.magenta('[AUTO GEMINI] Menjalankan otomatis...'));

        const tempMsg = {
            ...m,
            command: 'gemini',
            text: m.text || m.body || "",
            body: m.text || m.body || "",
            quoted: m.quoted
        };

        const geminiModule = await import('./gemini.js');
        await geminiModule.default.execute(tempMsg, sock, []);

        console.log(chalk.green('[AUTO GEMINI] Berhasil menjawab secara otomatis'));

    } catch (err) {
        console.error(chalk.red('[AUTO GEMINI ERROR]'), err);
        await m.reply('❌ Maaf, Gemini sedang bermasalah. Coba lagi nanti ya...').catch(() => {});
    }
}