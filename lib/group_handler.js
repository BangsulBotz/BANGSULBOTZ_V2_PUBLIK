import { getRawMessageById } from '../database/db_raw_messages.js';
import { getGroupSetting, setGroupSetting } from '../database/db_group.js';

const DEFAULT_CONFIG = {
    self: true,
    setinfo: 0,
    welcome: 0,
    antidelete: 0,
    autogemini: 0,
    antilinkall: { status: false, delete: false, kick: false },
    antisticker: { status: false, delete: false, kick: false },
    antilinkgc: { status: false, delete: false, kick: false },
    antibot: { status: false, delete: false, kick: false },
    antitagsw: { status: false, delete: false, kick: false },
    antitagall: { status: false, delete: false, kick: false },
    antiswgc: { status: false, delete: false, kick: false }
};

const checkStatus = (jid, feature) => {
    if (!jid?.endsWith('@g.us')) return DEFAULT_CONFIG[feature] ?? false;
    try {
        const status = getGroupSetting(jid, feature);
        return (status === null || status === undefined) ? (DEFAULT_CONFIG[feature] ?? false) : status;
    } catch (err) {
        return DEFAULT_CONFIG[feature] ?? false;
    }
};
export const isSelfGroup = (jid) => checkStatus(jid, 'self');
export const isSetInfoEnabled = (jid) => checkStatus(jid, 'setinfo');
export const isAntiLink = (jid) => checkStatus(jid, 'antilinkall');
export const isWelcomeEnabled = (jid) => checkStatus(jid, 'welcome');
export const isAntiDelete = (jid) => checkStatus(jid, 'antidelete');
export const isFeatureEnabled = (jid, feature) => checkStatus(jid, feature);


async function executeAntiAction(sock, msg, config, reason) {
    const { status, delete: shouldDelete, kick: shouldKick } = config;
    if (!status) return;

    const chatJid = msg.chat;
    const sender = msg.sender;
    const senderNumber = sender.split('@')[0];

    const warnText = `*── 「 ${reason.toUpperCase()} DETECTED 」 ──*\n\n` +
                     `◦ *User:* @${senderNumber}\n` +
                     `◦ *Pelanggaran:* Mengirim ${reason}\n` +
                     `◦ *Sanksi:* ${shouldDelete && shouldKick ? 'Hapus & Tendang' : shouldDelete ? 'Hapus Pesan' : shouldKick ? 'Tendang' : 'Peringatan'}`;

    const sentWarn = await sock.sendMessage(chatJid, { 
        text: warnText, 
        mentions: [sender] 
    }, { quoted: msg });

    let actionTaken = [];

    if (shouldDelete && msg.isBotAdmin) {
        await sock.sendMessage(chatJid, { delete: msg.key }).catch(() => {});
        actionTaken.push("Pesan Dihapus");
    }

    if (shouldKick && msg.isBotAdmin && !msg.isAdmin && !msg.isOwner) {
        await sock.groupParticipantsUpdate(chatJid, [sender], 'remove').catch(() => {});
        actionTaken.push("User Dikeluarkan");
    }

    if (actionTaken.length > 0) {
        await sock.sendMessage(chatJid, {
            edit: sentWarn.key,
            text: warnText + `\n◦ *Tindakan Akhir:* ${actionTaken.join(' & ')}`,
            mentions: [sender]
        });
    }
}

function detectBot(msg) {
    if (!msg || !msg.key?.id) return { isBot: false, reasons: [] };

    const m = msg.message;
    const fullId = msg.key.id;
    const isBotFlags = [];
    const reasons = [];

    const viewOnce = m?.viewOnceMessage?.message || m?.viewOnceMessageV2?.message;
    const hasButtons = (
        m?.interactiveMessage || 
        m?.buttonsMessage || 
        m?.templateMessage || 
        m?.listMessage ||
        viewOnce?.interactiveMessage || 
        viewOnce?.buttonsMessage || 
        viewOnce?.templateMessage || 
        viewOnce?.listMessage ||
        msg.msg?.buttons?.length > 0 || 
        msg.msg?.nativeFlowMessage?.buttons?.length > 0
    );

    if (hasButtons) {
        isBotFlags.push(true);
        reasons.push("Tombol Interaktif (Native Flow)");
    }

    const jpegThumbnail = m?.extendedTextMessage?.jpegThumbnail || msg.msg?.jpegThumbnail;
    if (jpegThumbnail && jpegThumbnail.length < 500) {
        isBotFlags.push(true);
        reasons.push("Thumbnail Terlalu Kecil (Bot Compression)");
    }

    const isNotHex = /[^0-9A-F]/i.test(fullId); 
    const hasDashes = fullId.includes('-'); 
    
    const ignoredPrefix = ["3EB0", "BAE5", "B1E", "WA"];
    const isIgnored = ignoredPrefix.some(p => fullId.startsWith(p));

    if (!isIgnored && (hasDashes || (isNotHex && fullId.length !== 32))) {
        isBotFlags.push(true);
        reasons.push("ID Pesan Custom (Non-Standard)");
    }

    const audioMsg = m?.audioMessage || viewOnce?.audioMessage;
    if (audioMsg?.ptt && !audioMsg?.waveform) {
        isBotFlags.push(true);
        reasons.push("Voice Note Tanpa Waveform");
    }

    const context = m?.extendedTextMessage?.contextInfo || 
                    m?.imageMessage?.contextInfo || 
                    m?.videoMessage?.contextInfo || 
                    viewOnce?.extendedTextMessage?.contextInfo;

    if (context?.isBotMessage) {
        isBotFlags.push(true);
        reasons.push("Official Bot Flag");
    }

    if (context?.externalAdReply) {
        const hasUrlInBody = /https?:\/\/[^\s]+/.test(msg.body || "");
        if (context.externalAdReply.renderLargerThumbnail && !hasUrlInBody) {
            isBotFlags.push(true);
            reasons.push("Fake External Ad-Reply");
        }
    }

    return { 
        isBot: isBotFlags.length > 0, 
        reasons 
    };
}

export async function groupUpdateHandler(sock, update) {
    const msg = update.messages ? update.messages[0] : update;
    if (!msg || !msg.key?.remoteJid?.endsWith('@g.us')) return;

    const chatJid = msg.key.remoteJid;

    if (msg.groupMetadata?.subject) {
        const currentSubject = getGroupSetting(chatJid, 'subject');
        if (currentSubject !== msg.groupMetadata.subject) {
            setGroupSetting(chatJid, 'subject', msg.groupMetadata.subject);
        }
    }

    const protocolMsg = msg.message?.protocolMessage;
    // --- [ ANTIDELETE ] ---
    if (protocolMsg && (protocolMsg.type === 0 || protocolMsg.type === 'REVOKE')) {
        if (!isAntiDelete(chatJid)) return;

        const targetId = protocolMsg.key.id;
        const data = getRawMessageById(targetId);
        if (!data || !data.rawObj) return;

        const originalMsg = data.rawObj;
        const pengirim = originalMsg.key.participant || originalMsg.key.remoteJid;
        const type = Object.keys(originalMsg.message || {})[0] || 'pesan';

        await sock.sendMessage(chatJid, { 
            text: `*── 「 ANTIDELETE DETECTED 」 ──*\n\n◦ *Dari:* @${pengirim.split('@')[0]}\n◦ *Tipe:* ${type}`, 
            mentions: [pengirim] 
        }, { quoted: originalMsg }).catch(() => {});

        await sock.sendMessage(chatJid, { forward: originalMsg }, { quoted: originalMsg }).catch(() => {});
        return;
    }

    if (!protocolMsg && msg.isGroup && msg.isBotAdmin && !msg.isOwner) {
        const body = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.body || "").trim();

        // --- [ ANTI STICKER ] ---
        const configSticker = getGroupSetting(chatJid, 'antisticker');
        if (configSticker?.status && !msg.isAdmin) {
            const isSticker = 
                msg.message?.stickerMessage || 
                msg.msg?.stickerMessage || 
                msg.type === 'stickerMessage' ||
                Object.keys(msg.message || {}).includes('stickerMessage');

            if (isSticker) {
                await executeAntiAction(sock, msg, configSticker, 'Sticker');
                return;
            }
        }

        // --- [ ANTI HIDETAG ] ---
        const configHT = getGroupSetting(chatJid, 'antihidetag');
        if (configHT?.status && !msg.isAdmin) {
            const directMentions = msg.mentionedJid || [];
            const contextMentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const allMentions = [...new Set([...directMentions, ...contextMentions])];
            
            const hasAtSymbol = /@/.test(body);
            if (allMentions.length > 0 && !hasAtSymbol) {
                await executeAntiAction(sock, msg, configHT, 'Hidetag');
                return;
            }
        }

        // --- [ ANTI LINK ALL ] ---
        const configLink = getGroupSetting(chatJid, 'antilinkall');
        if (configLink?.status && !msg.isAdmin) {
            const linkRegex = /(?:https?:\/\/|http?:\/\/|www\.|bit\.ly|t\.co|wa\.me|tinyurl\.com|goo\.gl|cutt\.ly|shorturl\.at|rebrand\.ly|is\.gd|rb\.gy|shrtco\.de|adf\.ly|ouo\.io|linkvertise\.com|linktr\.ee|v\.gd|lc\.chat|buff\.ly|lnkd\.in|dis\.gd|t2m\.io|x\.co|bc\.vc|gestyy\.com|clk\.sh|shorte\.st|ity\.im|cur\.lv|qrl\.es|soo\.gd|vzturl\.com|safeurl\.me|bitly\.com|snipurl\.com|b\.ly|tr\.im|cli\.gs|zzb\.bz|url\.ie|tiny\.cc|urlm\.in|prettylinkpro\.com|moourl\.com|unfurlr\.com|3url\.com|fuur\.net|plu\.sh|viralurl\.com|xurl\.es|starturl\.com|hex\.io|linkspy\.cc|hit\.sh|safelinking\.net|clkim\.com|xwb\.in|tny\.cz|ux\.nu|smll\.io|cut\.by|u\.bb|shrtfly\.com|shortcm\.li|smarturl\.it|linkly\.hq|shareasale\.com|clkmein\.com|cutpaid\.com|ay\.gy|micurl\.fr|shortenurl\.at|lil\.vn|zip\.li|croco\.me|gg\.gg|acortaz\.com|shorl\.com|tini\.cc|shrten\.com|shortcm\.com|shortenworld\.com|qps\.ru|po\.st|shorten\.sh|poplme\.co|scissor\.app|campus\.app|fuse\.io|snap\.ly|bebo\.com|y2u\.be|youtu\.be|linkz\.com|getlink\.info|play\.app|dl\.app|apkmonk\.com|zippyshare\.com|mediafire\.com|mega\.nz|anonfiles\.com|solidfiles\.com|sendgb\.com|filedropper\.com|uploadfiles\.io|files\.fm|krakenfiles\.com|dropbox\.com|drive\.google\.com|yadi\.sk|sendspace\.com|we\.tl|fex\.net|1fichier\.com|upfiles\.com|getfile\.cc|4shared\.com|openload\.co|megaup\.net|fireload\.com|racaty\.com|userscloud\.com|sendit\.cloud|ziddu\.com|gigafile\.nu|bayfiles\.com|anonfile\.com|filehost\.guru|sharemods\.com|uploadhaven\.com|terabox\.com|solidfile\.net|mediafirelink\.com|[\w.-]+\.(?:id|my\.id|biz\.id|xyz|me|net|com|org|info|co\.id))[^\s]*/gi;
            
            if (linkRegex.test(body)) {
                const code = await sock.groupInviteCode(chatJid).catch(() => null);
                const isInternalLink = code && body.includes(`chat.whatsapp.com/${code}`);

                if (isInternalLink) {
                    await sock.sendMessage(chatJid, {
                        text: `*✅ IZIN DIBERIKAN*\n◦ *Status:* Tautan grup ini diperbolehkan.\n◦ *Tindakan:* Pesan diterima tanpa sanksi.`,
                        contextInfo: { mentionedJid: [msg.sender] }
                    }, { quoted: msg });
                } else {
                    await executeAntiAction(sock, msg, configLink, 'Link Terlarang');
                }
            }
        }

        // --- [ ANTI LINK GROUP (WhatsApp Invite) ] ---
        const configLinkGc = getGroupSetting(chatJid, 'antilinkgc');
        if (configLinkGc?.status && !msg.isAdmin) {
            const gcLinkRegex = /chat.whatsapp.com\/([\w\d]*)/gi;
            
            if (gcLinkRegex.test(body)) {
                const code = await sock.groupInviteCode(chatJid).catch(() => null);
                const isInternalLink = code && body.includes(`chat.whatsapp.com/${code}`);

                if (isInternalLink) {
                    await sock.sendMessage(chatJid, {
                        text: `*✅ IZIN DIBERIKAN*\n◦ *Status:* Tautan grup ini diperbolehkan.\n◦ *Tindakan:* Pesan diterima tanpa sanksi.`,
                        contextInfo: { mentionedJid: [msg.sender] }
                    }, { quoted: msg });
                } else {
                    await executeAntiAction(sock, msg, configLinkGc, 'Tautan Grup Lain');
                    return;
                }
            }
        }
        // --- [ ANTI SW GC / GROUP STATUS ] ---
        const configSwGc = getGroupSetting(chatJid, 'antiswgc');
        if (configSwGc?.status && !msg.isAdmin) {
            const isSwGc = msg.message?.groupStatusMessageV2 || 
                        msg.msg?.groupStatusMessageV2 ||
                        Object.keys(msg.message || {}).includes('groupStatusMessageV2');

            if (isSwGc) {
                await executeAntiAction(sock, msg, configSwGc, 'Status ke Grup (SW GC)');
                return;
            }
        }

        // --- [ ANTI TAGALL / HIDETAG ] ---
        const configTagAll = getGroupSetting(chatJid, 'antitagall');
        if (configTagAll?.status) {
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || 
                                msg.message?.imageMessage?.contextInfo || 
                                msg.message?.videoMessage?.contextInfo;

            const isTagAll = contextInfo?.nonJidMentions === 1 || contextInfo?.nonJidMentions === true;

            if (isTagAll) {
                await executeAntiAction(sock, msg, configTagAll, 'Tag All / Hidetag');
                return;
            }
        }

        // --- [ ANTI BOT ] ---
        const configBot = getGroupSetting(chatJid, 'antibot');
        if (configBot?.status && !msg.fromMe && !msg.isAdmin) {
            const result = detectBot(msg);
            if (result.isBot) {
                const reason = `Bot Luar (${result.reasons.join(', ')})`;
                await executeAntiAction(sock, msg, configBot, reason);
                return;
            }
        }

        // --- [ ANTI TAG SW / STATUS MENTION ] ---
        const configTagSw = getGroupSetting(chatJid, 'antitagsw');
        if (configTagSw?.status && !msg.isAdmin) {
            const isTagSW = msg.message?.groupStatusMentionMessage || 
                            msg.message?.extendedTextMessage?.contextInfo?.externalAdReply?.statusSourceType === 'IMAGE' ||
                            (protocolMsg && protocolMsg.type === 'STATUS_MENTION_MESSAGE');

            if (isTagSW) {
                await executeAntiAction(sock, msg, configTagSw, 'Tag Status/SW');
                return;
            }
        }
    }
}
export const isAutoAIEnabled = (jid) => {
    if (!jid?.endsWith('@g.us')) return false;
    try {
        const setting = getGroupSetting(jid, 'autogemini');
        
        if (typeof setting === 'number') {
            return setting === 1;
        }
        if (typeof setting === 'object' && setting !== null) {
            return setting.status === true || setting.status === 1;
        }
        return !!setting;
    } catch (err) {
        console.error('[AUTO AI] Error cek setting:', err.message);
        return false;
    }
};
