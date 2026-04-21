import chalk from 'chalk';
import config from '../settings.js';
import { logPesanMasuk, serialize } from '../handler.js';
import { parseMs, sendErrorToOwner } from '../lib/utils.js';
import { antiPrivateChatHandler } from '../lib/protection.js';
import { saveRawMessage } from '../database/db_raw_messages.js';
import { handleGroupSystemMessages } from '../lib/groupMetadata.js';
import { blacklist, trustedDb, updateFromMessage } from '../database/db_user.js';
import { groupUpdateHandler, isAutoAIEnabled, isSelfGroup } from '../lib/group_handler.js';

export function handleMessagesUpsert(sock, events, msgCache, plugins, botDb) {
    if (events['messages.upsert']) {
        const m = events['messages.upsert'];

        if (m.type === 'notify') {
            for (const raw of m.messages) {

                const msgId = raw.key.id;
                if (msgCache.has(msgId)) continue;
                msgCache.add(msgId);

                if (raw.key.remoteJid?.endsWith('@g.us') &&
                    (raw.messageStubType || raw.message?.protocolMessage)) {

                    handleGroupSystemMessages(sock, raw).catch(err =>
                        console.error(chalk.red('[GROUP SYSTEM MSG ERROR]'), err)
                    );

                    if (!raw?.message) continue;
                }

                if (!raw?.message) continue;

                updateFromMessage(raw.key, raw.pushName);

                const sender = raw.key.participant || raw.key.remoteJid;
                const senderAlt = raw.key.participantAlt;

                const checkBan = blacklist.check(sender) || (senderAlt && blacklist.check(senderAlt));
                if (checkBan.isBlocked) {
                    if (!sender.includes(config.owner)) continue;
                }

                const pText = raw.message?.conversation || raw.message?.extendedTextMessage?.text || '';
                if (pText === 'ping') {
                    sock.sendMessage(raw.key.remoteJid, { text: `Pong kentut!` });
                    continue;
                }

                processMessage(sock, raw, m.type, plugins, botDb);
            }
        }
    }
}

/**
 * Proses utama satu pesan
 */
async function processMessage(sock, raw, type, plugins, botDb) {

    const msg = await serialize({ messages: [raw], type }, sock);
    if (!msg) return;

    // Auto AI (Gemini) jika quoted from bot
    if (msg.quoted?.fromBot === true) {
        const autoAIStatus = isAutoAIEnabled(msg.chat);
        if (autoAIStatus) {
            import('../plugins/ai/gemini.js')
                .then(module => module.runAutoGemini(msg, sock))
                .catch(err => console.error(chalk.red('[AUTO GEMINI ERROR]'), err));
        } else {
            console.log(chalk.yellow('[AUTO AI] AutoAI dinonaktifkan di grup ini'));
        }
    }

    // Anti Private Chat
    const isRejected = await antiPrivateChatHandler(sock, msg, plugins);
    if (isRejected) return;

    // AFK Handler
    await handleAfkSystem(sock, msg, raw);

    // Command Processing
    const { command: commandText, prefix: usedPrefix, body: text, chat: chatJid } = msg;

    const isSelfMode = botDb.getSetting('self', false);
    const plugin = plugins.get(commandText) ||
        [...plugins.values()].find(p => p.alias?.includes(commandText));

    let isAllowed = msg.isOwner;
    if (!isAllowed && plugin) {
        isAllowed = trustedDb.check(msg.sender, plugin.command);
    }

    let shouldProcess = true;
    if (isSelfMode || (msg.isGroup && await isSelfGroup(msg.chat))) {
        if (!isAllowed) shouldProcess = false;
    }

    if (shouldProcess && commandText) {
        if (plugin) {
            await executePlugin(sock, msg, raw, plugin, commandText, usedPrefix, text, chatJid, plugins, isAllowed);
        } 
    }

    await groupUpdateHandler(sock, msg);

    setImmediate(() => backgroundTasks(raw, msg, commandText, plugin));
}

// ==================== HELPER FUNCTIONS ====================

async function handleAfkSystem(sock, msg, raw) {
    const afkRef = global.botDb?.afk;
    if (!afkRef || !afkRef[msg.chat]) return;

    const groupAfk = afkRef[msg.chat];
    const sender = msg.sender;
    const participantAlt = msg.key.participantAlt;
    const userAfk = groupAfk[sender] || (participantAlt && groupAfk[participantAlt]);

    if (userAfk) {
        const duration = parseMs(Date.now() - userAfk.time);
        await msg.reply(`*── 「 STOP AFK 」 ──*\n\n` +
            `Halo @${sender.split('@')[0]}, status AFK kamu di grup ini telah dicabut.\n\n` +
            `◦ *Nama:* ${msg.pushName || 'User'}\n` +
            `◦ *Durasi:* ${duration}\n` +
            `◦ *Alasan:* ${userAfk.reason || 'Tanpa alasan'}`,
            { mentions: [sender] }
        );

        [sender, participantAlt, userAfk.lid, userAfk.pn].forEach(k => {
            if (k) delete groupAfk[k];
        });

        if (Object.keys(groupAfk).length === 0) delete afkRef[msg.chat];

        if (typeof global.saveBotDb === 'function') global.saveBotDb();
    }

    // Cek mention user yang AFK
    if (msg.body?.includes('@') || msg.quoted) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo ||
            msg.message?.imageMessage?.contextInfo ||
            msg.message?.videoMessage?.contextInfo || {};

        const rawMentions = ctx.mentionedJid || [];
        if (msg.quoted) rawMentions.push(msg.quoted.sender);

        const mentions = [...new Set(rawMentions)].slice(0, 3);

        for (let jid of mentions) {
            const data = groupAfk[jid];
            if (data && jid !== sender && jid !== participantAlt) {
                const duration = parseMs(Date.now() - data.time);
                await msg.reply(`*── 「 USER AFK 」 ──*\n\n` +
                    `Ssst! @${jid.split('@')[0]} sedang AFK di grup ini.\n\n` +
                    `◦ *Alasan:* ${data.reason}\n◦ *Sejak:* ${duration}`,
                    { mentions: [jid] }
                );
                break;
            }
        }
    }
}

async function executePlugin(sock, msg, raw, plugin, commandText, usedPrefix, text, chatJid, plugins, isAllowed) {
    // onlyOwner: lolos jika owner ATAU sudah di-trust untuk command ini
    if (plugin.onlyOwner && !isAllowed) {
        await msg.reply(config.pesan.ownerOnly); return;
    }
    if (plugin.onlyGroup && !msg.isGroup) {
        await msg.reply(config.pesan.groupOnly); return;
    }
    if (plugin.onlyPrivate && msg.isGroup) {
        await msg.reply(config.pesan.privateOnly); return;
    }

    if (msg.isGroup) {
        // onlyAdmin: trusted user juga bypass cek admin
        if (plugin.onlyAdmin && !msg.isAdmin && !isAllowed) {
            await msg.reply(config.pesan.adminOnly); return;
        }
        if (plugin.onlyBotAdmin && !msg.isBotAdmin) {
            await msg.reply(config.pesan.botAdmin); return;
        }
    }

    let typingInterval = null;

    try {
        const args = text.slice(usedPrefix.length + commandText.length).trim().split(/ +/);

        if (plugin.typing === true) {
            await sock.sendPresenceUpdate('composing', chatJid);
            typingInterval = setInterval(() =>
                sock.sendPresenceUpdate('composing', chatJid).catch(() => { }), 8000);
        }

        if (plugin.wait) {
            await sock.sendMessage(chatJid, { text: config.pesan.wait }, { quoted: raw });
        }

        await plugin.execute(msg, sock, args, plugins);

        if (plugin.message_done) {
            await msg.reply(config.pesan.done);
        }

    } catch (err) {
        console.error(chalk.red.bold(`Error execute ${commandText}:`), err);
        await sendErrorToOwner(sock, err, msg, commandText);
    } finally {
        if (typingInterval) {
            clearInterval(typingInterval);
            sock.sendPresenceUpdate('paused', chatJid).catch(() => { });
        }
    }
}

function backgroundTasks(raw, msg, commandText, plugin) {
    try {
        if (commandText && plugin) {
            const feature = plugin.command;
            const userJid = msg.sender;
            const groupJid = msg.isGroup ? msg.chat : null;

            import('../database/db_hit.js').then(module => {
                module.saveFeatureHit(userJid, feature, groupJid, 1);
            }).catch(e => console.error('[HIT] Gagal simpan:', e.message));
        }

        if (config.debugRawJson === true) {
            console.log(chalk.whiteBright('\n--- [ DEBUG RAW MESSAGE ] ---\n'), JSON.stringify(raw, null, 2));
        }

        const orderNumber = saveRawMessage(raw);
        logPesanMasuk({ ...msg, order: orderNumber || 'SAVED' });

    } catch (e) {
        console.error('[Background Task Error]', e.message);
    }
}