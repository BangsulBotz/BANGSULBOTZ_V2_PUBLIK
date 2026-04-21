import chalk from 'chalk';
import config from '../settings.js';
import { botDb } from '../database/db_bot.js';

export async function callUpdateHandler(sock, callUpdate) {
    const isAntiCall = botDb.getSetting('anticall', true);
    if (!isAntiCall) return;

    const call = callUpdate[0];
    if (!call || call.isGroup) return;

    if (call.status === 'offer') {
        const from = call.from;
        const ownerNumber = config.owner + '@s.whatsapp.net';
        console.log(chalk.red.bold(`[ANTICALL] Menolak panggilan dari: ${from}`));
        
        await sock.rejectCall(call.id, from);
        await sock.sendMessage(from, {
            text: `*── 「 ANTI CALL 」 ──*\n\n` +
                `Mohon maaf, bot tidak dapat menerima panggilan.\n` +
                `Silakan hubungi Owner @${config.owner} jika ada keperluan mendesak.\n\n` +
                `> *Status:* Call Auto Rejected ✅`,
            contextInfo: {
                mentionedJid: [ownerNumber],
                externalAdReply: {
                    title: `CALL REJECTED BY ${config.botName}`,
                    body: `Jangan menelpon bot, owner akan marah!`,
                    previewType: "PHOTO",
                    thumbnailUrl: config.thumbnail,
                    sourceUrl: config.my.grup
                }
            }
        });
    }
}

export async function antiPrivateChatHandler(sock, msg, plugins) {
    const isAntiPc = botDb.getSetting('antipc', true);
    if (!isAntiPc || msg.isGroup || msg.chat.endsWith('@newsletter') || msg.isOwner) return false;

    const name = msg.command?.toLowerCase();
    const isCommandExist = plugins.has(name) || [...plugins.values()].find(p => p.alias?.includes(name));

    if (!isCommandExist) return false;

    const caption = `*── 「 ANTI PRIVATE CHAT 」 ──*\n\n` +
        `Mohon maaf @${msg.sender.split('@')[0]},\n` +
        `Fitur *${name}* tidak dapat digunakan di chat pribadi.\n\n` +
        `Silakan gunakan bot di dalam grup resmi kami:\n` +
        `🔗 ${config.my.grup || 'Link belum tersedia'}\n\n` +
        `> *Status:* Command Rejected ✅`;

    await sock.sendMessage(msg.chat, {
        text: caption,
        contextInfo: {
            mentionedJid: [msg.sender]
        }
    }, { quoted: msg });

    return true;
}