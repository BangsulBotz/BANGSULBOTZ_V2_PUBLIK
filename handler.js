import { downloadContentFromMessage } from 'baileys';
import chalk from 'chalk';
import { getName, getUserData } from './database/db_user.js';
import config from './settings.js';
import { getGroupMetadata, setGroupMetadata } from './store.js';

const fetchingGroups = new Set();

/**
 * Update metadata grup dan simpan ke store
 */
export async function updateGroupMetadata(sock, groupJid) {
    if (!groupJid?.endsWith('@g.us')) return null;
    try {
        const metadata = await sock.groupMetadata(groupJid);
        setGroupMetadata(groupJid, metadata);
        return metadata;
    } catch (err) {
        console.log(chalk.red('Gagal update metadata grup:'), chalk.gray(err.message));
        return null;
    }
}

/**
 * Membersihkan JID dari suffix/prefix yang tidak perlu
 */
export function normalizeJid(jid) {
    if (!jid) return jid;
    const cleaned = jid.split('/')[0].split(':')[0];
    return cleaned.includes('@') ? cleaned : `${cleaned}@s.whatsapp.net`;
}

/**
 * Mengambil pengirim asli (menangani perbedaan remoteJid/participant)
 */
export function getRealSender(key) {
    if (key.remoteJidAlt) return normalizeJid(key.remoteJidAlt);
    if (key.participantAlt) return normalizeJid(key.participantAlt);
    if (key.participant) return normalizeJid(key.participant);
    return normalizeJid(key.remoteJid);
}

/**
 * Deteksi jenis perangkat berdasarkan Stanza ID
 */
function getDevice(id) {
    if (!id) return 'unknown';
    const clean = id.split('-')[0];
    if (/^[A-Z0-9]{18}$/.test(clean)) return 'ios';
    if (/^[A-Z0-9]{20}$/.test(clean)) return 'web';
    if (/^[A-Z0-9]{21,32}$/.test(clean)) return 'android';
    return 'unknown';
}

/**
 * Fungsi utama untuk memproses dan memperluas objek pesan (Serialize)
 */
export async function serialize(m, sock) {

    if (!m?.messages?.[0]) return null;
    const msg = m.messages[0];
    if (!msg?.message) return null;

    // --- Identitas Bot & Pengirim ---
    const botId = sock.user?.id ? sock.user.id.split(':')[0].split('@')[0] : null;
    const botNumber = sock.user?.id ? normalizeJid(sock.user.id) : null;
    const sender = getRealSender(msg.key);
    const isFromMe = msg.key.fromMe;
    const ownerNumber = config.owner.replace(/[^0-9]/g, '');

    const senderId = sender.split(':')[0].split('@')[0];
    const isBotSelf = senderId === botId || isFromMe;
    const isOwner = sender.split('@')[0] === ownerNumber || isFromMe;

    // --- Struktur Dasar Pesan ---
    const extended = {
        ...msg,
        key: msg.key,
        id: msg.key.id,
        fromMe: isBotSelf,
        chat: msg.key.remoteJid,
        sender,
        isGroup: msg.key.remoteJid?.endsWith('@g.us'),
        timestamp: msg.messageTimestamp?.low ?? msg.messageTimestamp ?? Math.floor(Date.now() / 1000),
        pushName: msg.pushName || 'Unknown',
        device: getDevice(msg.key.id),
        isOwner: isOwner
    };

    // --- Logika Grup ---
    if (extended.isGroup) {
        const cached = getGroupMetadata(extended.chat);
        if (!cached && !fetchingGroups.has(extended.chat)) {
            fetchingGroups.add(extended.chat);
            updateGroupMetadata(sock, extended.chat).then(() => {
                fetchingGroups.delete(extended.chat);
            });
        }

        // --- PENGGUNAAN GETTER (Bukan simpan di variabel) ---
        Object.defineProperties(extended, {
            'groupMetadata': {
                get() { return getGroupMetadata(this.chat) || null; },
                configurable: true,
                enumerable: true
            },
            'groupName': {
                get() { return this.groupMetadata?.subject || 'Grup Tanpa Nama'; },
                configurable: true,
                enumerable: true
            },
            'participants': {
                get() { return this.groupMetadata?.participants || []; },
                configurable: true,
                enumerable: true
            },
            'isAdmin': {
                get() {
                    const parts = this.participants;
                    // Cek berdasarkan ID (@lid) atau phoneNumber (@s.whatsapp.net)
                    return parts.some(p =>
                        (p.id === this.sender || p.phoneNumber === this.sender) &&
                        (p.admin === 'admin' || p.admin === 'superadmin')
                    );
                },
                configurable: true,
                enumerable: true
            },
            'isBotAdmin': {
                get() {
                    const botJid = normalizeJid(sock.user.id);
                    return this.participants.some(p =>
                        (p.id === botJid || p.phoneNumber === botJid) &&
                        (p.admin === 'admin' || p.admin === 'superadmin')
                    );
                },
                configurable: true,
                enumerable: true
            }
        });
    }

    // --- Parsing Tipe & Isi Pesan ---
    const messageType = Object.keys(msg.message)[0] === 'messageContextInfo'
        ? Object.keys(msg.message)[1]
        : Object.keys(msg.message)[0];

    extended.type = messageType;
    extended.msg = msg.message[messageType];
    extended.mentionedJid = extended.msg?.contextInfo?.mentionedJid || [];

    // --- [PENTING] SUNTIK LOGIKA REACTION ---
    if (messageType === 'reactionMessage') {
        const react = extended.msg;
        if (react.text === '❌') {
            extended.body = '.delete';
            extended.text = '.delete';
            extended.prefix = '.';
            extended.command = 'delete';

            extended.quoted = {
                key: {
                    remoteJid: extended.chat,
                    fromMe: react.key.fromMe,
                    id: react.key.id,
                    participant: react.key.participant || react.key.remoteJid
                },
                sender: normalizeJid(react.key.participant || react.key.remoteJid),
                text: '',
                isMedia: false
            };
        }
    }
    
    // --- Penanganan Button / List / Interactive Response ---
    let btnId = '';
    let btnText = '';

    if (messageType === 'buttonsResponseMessage') {
        btnId = extended.msg?.selectedButtonId || '';
        btnText = extended.msg?.selectedDisplayText || '';
    } else if (messageType === 'listResponseMessage') {
        btnId = extended.msg?.singleSelectReply?.selectedRowId || '';
        btnText = extended.msg?.singleSelectReply?.title || '';
    } else if (messageType === 'interactiveResponseMessage') {
        try {
            const params = JSON.parse(extended.msg?.nativeFlowResponseMessage?.paramsJson || '{}');
            btnId = params.id || params.selected_row_id || params.selectedId || params.rowId || '';
            btnText = params.title || params.display_text || '';
        } catch {
            btnId = '';
        }
    } else if (messageType === 'templateButtonReplyMessage') {
        btnId = extended.msg?.selectedId || '';
        btnText = extended.msg?.selectedDisplayText || '';
    }

    extended.buttonId = btnId;
    extended.selectedDisplayText = btnText;

    // --- Menentukan Body / Text Utama ---
    extended.body = (
        extended.body || 
        btnId ||
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        extended.msg?.text ||
        extended.msg?.caption ||
        ''
    ).trim();

    extended.text = extended.body;

    // --- Parsing Prefix & Command ---
    if (!extended.command) {
        let usedPrefix = '';
        let commandText = '';
        const matchedPrefix = config.prefixes.find(p => extended.text.startsWith(p));

        if (matchedPrefix) {
            usedPrefix = matchedPrefix;
            commandText = extended.text.slice(usedPrefix.length).trim().split(/ +/)[0].toLowerCase();
        } else if (config.noprefix) {
            commandText = extended.text.trim().split(/ +/)[0].toLowerCase();
        }

        extended.prefix = usedPrefix;
        extended.command = commandText;
    }

    // --- Media & Mimetype ---
    extended.mime = extended.msg?.mimetype || '';
    extended.isMedia = !!(extended.mime || extended.msg?.thumbnailDirectPath);
    extended.mediaType = null;

    if (extended.isMedia) {
        if (extended.mime.startsWith('image/')) extended.mediaType = extended.mime === 'image/webp' ? 'sticker' : 'image';
        else if (extended.mime.startsWith('video/')) extended.mediaType = 'video';
        else if (extended.mime.startsWith('audio/')) extended.mediaType = 'audio';
        else if (/pdf|msword|openxmlformats-officedocument/.test(extended.mime)) extended.mediaType = 'document';
        else extended.mediaType = 'file';
        extended.caption = (extended.msg.caption || '').trim();
    }

    // --- Interactive Message ID (Button/List) ---
    extended.buttonId = '';
    if (messageType === 'buttonsResponseMessage') {
        extended.buttonId = extended.msg?.selectedButtonId || '';
    } else if (messageType === 'listResponseMessage') {
        extended.buttonId = extended.msg?.singleSelectReply?.selectedRowId || '';
    } else if (messageType === 'interactiveResponseMessage') {
        try {
            const params = JSON.parse(extended.msg?.nativeFlowResponseMessage?.paramsJson || '{}');
            extended.buttonId = params.id || params.selected_row_id || '';
        } catch { }
    }

    // --- Quoted Message (Pesan Balasan) ---
    const context = msg.message?.extendedTextMessage?.contextInfo || extended.msg?.contextInfo;

    if (context?.quotedMessage) {
        const qMsg = context.quotedMessage;
        const qType = Object.keys(qMsg)[0];

        const quotedData = {
            key: {
                remoteJid: extended.chat,
                participant: normalizeJid(context.participant),
                id: context.stanzaId,
            },
            type: qType,
            msg: qMsg[qType],
            text: (qMsg[qType]?.text || qMsg[qType]?.caption || qMsg.conversation || '').trim(),
            sender: normalizeJid(context.participant),
            mentionedJid: qMsg[qType]?.contextInfo?.mentionedJid || [],
            isMedia: !!(qMsg[qType]?.mimetype),
            mime: qMsg[qType]?.mimetype || '',
            get pushName() {
                return getName(this.sender) || 'User';
            }
        };

        // Properti contact
        Object.defineProperty(quotedData, 'contact', {
            get() {
                const data = getUserData(this.sender);
                return {
                    pushName: data?.name || this.pushName || 'Unknown',
                    lid: data?.lid || (this.sender.endsWith('@lid') ? this.sender : ''),
                    pn: data?.jid || (this.sender.endsWith('@s.whatsapp.net') ? this.sender : '')
                };
            },
            configurable: true,
            enumerable: true
        });

        // Fungsi download media
        quotedData.download = async () => {
            const quotednya = quotedData.msg;
            const mimenya = quotednya.mimetype || '';
            const messageType = (quotedData.type.replace(/Message/gi, ''));
            const stream = await downloadContentFromMessage(quotednya, messageType.toLowerCase());
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        };

        extended.quoted = quotedData;

        // ====================== quoted.fromBot ======================
        const botJid = global.botJid || (sock.user?.id ? normalizeJid(sock.user.id) : null);
        const botLid = global.botLid || null;

        const quotedSender = extended.quoted.sender || '';

        const cleanBotJid = botJid ? botJid.split(/[@:]/)[0] : '';
        const cleanBotLid = botLid ? botLid.split(/[@:]/)[0] : '';
        const cleanQuoted = quotedSender.split(/[@:]/)[0];

        extended.quoted.fromBot =
            !!(cleanQuoted === cleanBotJid ||
                cleanQuoted === cleanBotLid ||
                quotedSender === botJid ||
                quotedSender === botLid);

    } else {
        // Tidak ada quoted message
        extended.quoted = null;
    }

    // ====================== AUTO AI TRIGGER DETECTION ======================
    if (extended.quoted?.fromBot === true) {
        console.log(chalk.bgGreen.black.bold(`[AUTO AI DEBUG] ✓ BERHASIL - Reply ke Pesan Bot Terdeteksi!`));
        console.log(chalk.cyan('   Group :'), chalk.white(extended.groupName || extended.chat));
        console.log(chalk.cyan('   Sender:'), chalk.white(extended.pushName));
        console.log(chalk.green('   Text  :'), chalk.white(extended.text || '(media)'));

        extended.triggerAutoAI = true;   // Flag ini bisa gunakan di handler Auto AI
    }
    else if (extended.quoted) {
        console.log(chalk.yellow(`[AUTO AI DEBUG] Reply detected → tapi BUKAN ke pesan bot`));
        console.log(chalk.gray(`   quoted.sender     : ${extended.quoted.sender || 'undefined'}`));
        console.log(chalk.gray(`   quoted.fromBot    : ${extended.quoted.fromBot}`));
        console.log(chalk.gray(`   botJid            : ${global.botJid || 'undefined'}`));
        console.log(chalk.gray(`   botLid            : ${global.botLid || 'undefined'}`));
    }
    // =====================================================================

    if (extended.fromMe && !extended.command) return null;

    // --- Fungsi Reply Pintar ---
    extended.reply = async (text, options = {}) => {
        const mentions = [...text.matchAll(/@([0-9]{5,16})/g)].map(v => v[1] + '@lid');
        const finalMentions = options.mentions ? [...options.mentions, ...mentions] : mentions;

        return sock.sendMessage(extended.chat, {
            text: text,
            mentions: finalMentions,
            ...options
        }, { quoted: msg });
    };

    return extended;
}


/**
 * Log setiap pesan masuk ke terminal
 */
export function logPesanMasuk(m) {
    // Filter: Abaikan bot lain, tapi izinkan log jika itu bot sendiri (fromMe)
    //if (!m || (!m.fromMe)) return;

    console.log(chalk.gray('────────────────────────────────────────────────────'));
    if (m.order) {
        console.log(chalk.gray('Order di DB     :'), chalk.magenta(`#${m.order}`));
    }

    console.log(chalk.cyan('Username        :'), chalk.white(m.pushName || '~HUMAN~'));
    console.log(chalk.cyan('📱 Nomor        :'), chalk.white((m.sender)));

    // 3. Lokasi Pesan
    if (m.isGroup) {
        console.log(chalk.cyan('🗂️  Dari         :'), chalk.green(`Grup: ${m.groupName || 'Grup Tanpa Nama'}`));
        console.log(chalk.gray('└─ JID Grup     :'), chalk.gray(m.chat));
    } else {
        console.log(chalk.cyan('🗂️  Dari         :'), chalk.green('Private Chat'));
    }

    // 4. Quoted (Jika membalas pesan)
    if (m.quoted) {
        console.log(chalk.yellow('─── Balasan ke:'));
        console.log(chalk.gray('├─ JID          :'), chalk.white((m.quoted.sender) || 'User'));
        console.log(chalk.gray('├─ Nama         :'), chalk.white(m.quoted.pushName || 'User'));

        if (m.quoted.isMedia) {
            const mediaLabel = m.quoted.mediaType || m.quoted.mime?.split('/')[0] || 'file';
            console.log(chalk.gray('├─ Media        :'), chalk.yellow(`[${mediaLabel}]`));
            console.log(chalk.gray('└─ Caption      :'), chalk.gray(m.quoted.caption || '[tanpa caption]'));
        } else {
            const shortText = m.quoted.text?.length > 40 ? m.quoted.text.substring(0, 37) + '...' : m.quoted.text || '[no text]';
            console.log(chalk.gray('└─ Isi Pesan    :'), chalk.gray(shortText));
        }
    }

    // 5. Detail Pesan Utama
    console.log(chalk.cyan('─── Pesan:'));
    console.log(chalk.gray('├─ ID Pesan     :'), chalk.bgBlack.yellow(m.id));

    if (m.isMedia) {
        const mediaLabel = m.mediaType || m.mime?.split('/')[0] || 'unknown';
        console.log(chalk.gray('└─ Media        :'), chalk.yellow(`[${mediaLabel}]`));
        if (m.caption) {
            console.log(chalk.gray('   └─ Caption   :'), chalk.yellow(m.caption));
        }
    } else {
        console.log(chalk.gray('└─ Isi Pesan    :'), chalk.whiteBright(m.text || '[tidak ada teks]'));
    }

    console.log(chalk.gray('────────────────────────────────────────────────────'));
}
