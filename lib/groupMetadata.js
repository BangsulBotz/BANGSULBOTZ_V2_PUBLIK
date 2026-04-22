import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import { fileURLToPath } from 'url';
import config from '../settings.js';
import { updateGroupMetadata } from '../handler.js';
import { isSetInfoEnabled, isWelcomeEnabled } from './group_handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const linkTargetThumbnail = config.my.gh;
const ephemeralDebounce = new Map();

async function getProfilePicture(sock, jid) {
    try {
        return await sock.profilePictureUrl(jid, 'image');
    } catch {
        return 'https://telegra.ph/file/95670d63378f7f4210f03.png';
    }
}

export function registerGroupMetadataListeners(sock) {

    const debugLog = (tag, data, colorBg = 'bgWhite', colorText = 'black') => {
        if (config.debugRawJson) {
            console.log(chalk[colorBg][colorText].bold(`\n 🔎 [DEBUG] EVENT: ${tag} `));
            console.log(JSON.stringify(data, null, 2));
            console.log(chalk.gray('───────────────────────────────────────────────────'));
        }
    };

    sock.ev.on('groups.update', (u) => debugLog('groups.update', u, 'bgWhite', 'black'));
    sock.ev.on('groups.upsert', (g) => debugLog('groups.upsert', g, 'bgCyan', 'black'));
    sock.ev.on('group-join-request', (r) => debugLog('group-join-request', r, 'bgBlue', 'white'));
    sock.ev.on('contacts.update', (c) => debugLog('contacts.update', c, 'bgGreen', 'black'));
    sock.ev.on('contacts.upsert', (c) => debugLog('contacts.upsert', c, 'bgGreen', 'black'));
    sock.ev.on('call', (c) => debugLog('call', c, 'bgRed', 'white'));
    sock.ev.on('chats.delete', (c) => debugLog('chats.delete', c, 'bgRed', 'black'));
    sock.ev.on('chats.update', (c) => debugLog('chats.update', c, 'bgYellow', 'black'));
    sock.ev.on('labels.edit', (l) => debugLog('labels.edit', l, 'bgCyan', 'black'));
    sock.ev.on('connection.update', (update) => debugLog('connection.update', update, 'bgMagenta', 'white'));

    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            const jid = update.id;
            const authorJid = update.author || '';
            const authorTag = authorJid ? `@${authorJid.split('@')[0]}` : 'Admin';

            const isEnabled = await isSetInfoEnabled(jid);
            if (!isEnabled) continue;

            let logText = '';
            let title = '';
            let body = '';

            if (update.subject !== undefined) {
                logText = `mengganti nama grup menjadi: *${update.subject}*`;
                title = 'NAMA GRUP';
                body = update.subject;
            } else if (update.desc !== undefined) {
                logText = `memperbarui deskripsi atau info grup.`;
                title = 'DESKRIPSI';
                body = 'Deskripsi diperbarui';
            } else if (update.restrict !== undefined) {
                logText = update.restrict
                    ? `membatasi izin edit info grup (Admin Only).`
                    : `membuka izin edit info grup (Semua Peserta).`;
                title = 'IZIN EDIT INFO';
                body = update.restrict ? 'ADMIN ONLY' : 'SEMUA PESERTA';
            } else if (update.announce !== undefined) {
                logText = update.announce
                    ? `menutup gerbang obrolan (Admin Only).`
                    : `membuka obrolan (Semua Peserta).`;
                title = 'IZIN CHAT';
                body = update.announce ? 'CLOSED' : 'OPENED';
            } else if (update.memberAddMode !== undefined) {
                logText = update.memberAddMode
                    ? `mengizinkan semua anggota menambah peserta.`
                    : `menarik izin tambah anggota (Admin Only).`;
                title = 'IZIN TAMBAH PESERTA';
                body = update.memberAddMode ? 'DIIZINKAN' : 'DILARANG';
            } else if (update.joinApprovalMode !== undefined) {
                logText = update.joinApprovalMode
                    ? `mengaktifkan sistem persetujuan admin.`
                    : `mematikan sistem persetujuan admin.`;
                title = 'MEMBER APPROVAL';
                body = update.joinApprovalMode ? 'AKTIF' : 'NONAKTIF';
            }

            if (!logText) continue;

            const profilePicUrl = await getProfilePicture(sock, authorJid || jid);
            const logTextFull = `🛡️ *LOG SISTEM GRUP*\n\n${authorTag} ${logText}`;

            await sock.sendWithThumbnail(jid, {
                text: logTextFull,
                title,
                body,
                thumbnailUrl: profilePicUrl,
                sourceUrl: linkTargetThumbnail,
                mentions: authorJid ? [authorJid] : []
            });

            await safeUpdateMetadata(sock, jid);
        }
    });

    sock.ev.on('contacts.update', async (updates) => {
        for (const update of updates) {
            if (!update.id?.endsWith('@g.us')) continue;
            if (update.imgUrl !== 'changed') continue;

            const jid = update.id;
            const isEnabled = await isSetInfoEnabled(jid);
            if (!isEnabled) continue;

            let authorJid = '';
            let authorTag = 'Admin';
            try {
                const meta = await sock.groupMetadata(jid);
            } catch { }

            const profilePicUrl = await getProfilePicture(sock, jid);

            await sock.sendWithThumbnail(jid, {
                text: `🛡️ *LOG SISTEM GRUP*\n\n${authorTag} baru saja memperbarui foto profil grup ini.`,
                title: 'FOTO GRUP',
                body: 'Tampilan baru',
                thumbnailUrl: profilePicUrl,
                sourceUrl: linkTargetThumbnail,
                mentions: []
            });

            await safeUpdateMetadata(sock, jid);
        }
    });

    sock.ev.on('chats.update', async (updates) => {
        for (const update of updates) {
            const jid = update.id;
            if (!jid?.endsWith('@g.us')) continue;
            if (update.ephemeralExpiration === undefined && update.ephemeralExpiration !== null) continue;
            if (!('ephemeralExpiration' in update)) continue;

            const isEnabled = await isSetInfoEnabled(jid);
            if (!isEnabled) continue;

            let authorJid = update.author || '';
            const authorTag = authorJid ? `@${authorJid.split('@')[0]}` : 'Admin';

            const exp = update.ephemeralExpiration;
            let durasiText = '';

            if (!exp || exp === 0) {
                durasiText = 'dimatikan';
            } else if (exp === 86400) {
                durasiText = '24 jam';
            } else if (exp === 604800) {
                durasiText = '7 hari';
            } else if (exp === 7776000) {
                durasiText = '90 hari';
            } else {
                durasiText = `${exp} detik`;
            }

            const logText = (!exp || exp === 0)
                ? `menonaktifkan pesan sementara.`
                : `mengubah durasi pesan sementara menjadi *${durasiText}*.`;

            const profilePicUrl = await getProfilePicture(sock, authorJid || jid);

            await sock.sendWithThumbnail(jid, {
                text: `🛡️ *LOG SISTEM GRUP*\n\n${authorTag} ${logText}`,
                title: 'PESAN SEMENTARA',
                body: durasiText.toUpperCase(),
                thumbnailUrl: profilePicUrl,
                sourceUrl: linkTargetThumbnail,
                mentions: authorJid ? [authorJid] : []
            });

            await safeUpdateMetadata(sock, jid);
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        const jid = update.id;
        const authorJid = update.author || '';
        const authorTag = authorJid ? `@${authorJid.split('@')[0]}` : 'Sistem';

        const participant = update.participants[0];
        let targetJid = (typeof participant === 'string')
            ? participant
            : (participant?.phoneNumber || participant?.id || participant?.jid || '');

        const rawTargets = update.participants.map(p =>
            (typeof p === 'string' ? p : p?.id || p?.jid || '')
        ).filter(Boolean);

        const targetTags = rawTargets.map(id => `@${id.split('@')[0]}`).join(', ');

        let actionText = '', title = '', body = '';
        const mentions = authorJid ? [authorJid, ...rawTargets] : rawTargets;

        const isWelcomeOn = await isWelcomeEnabled(jid);
        const isSetInfoOn = await isSetInfoEnabled(jid);

        if (update.action === 'add' || update.action === 'remove') {
            if (!isWelcomeOn && !isSetInfoOn) return;

            const isJoin = update.action === 'add';
            title = isJoin ? 'BERGABUNG' : 'KELUAR';
            body = isJoin ? 'Selamat datang!' : 'Sayonara!';

            if (isJoin) {
                actionText = (authorJid === '' || authorJid === rawTargets[0])
                    ? `${targetTags} baru saja bergabung menggunakan tautan.`
                    : `${authorTag} baru saja menambahkan ${targetTags}.`;
            } else {
                actionText = (authorJid === rawTargets[0])
                    ? `${targetTags} telah meninggalkan grup.`
                    : `${authorTag} telah mengeluarkan ${targetTags}.`;
            }

            try {
                let ppUrl = 'https://telegra.ph/file/95670d63378f7f4210f03.png';
                try {
                    ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                } catch { }

                await sock.sendWithThumbnail(jid, {
                    text: `👥 *UPDATE PESERTA GRUP*\n\n${actionText}`,
                    title,
                    body,
                    thumbnailUrl: ppUrl,
                    sourceUrl: linkTargetThumbnail,
                    mentions
                });

                await safeUpdateMetadata(sock, jid);
                return;
            } catch (e) {
                console.error(`Error ${update.action} Update:`, e);
            }
        }

        else if (update.action === 'promote') {
            actionText = `Selamat! ${authorTag} mengangkat ${targetTags} jadi Admin.`;
            title = 'PROMOTED';
            body = 'Jabatan: Admin';
        }

        else if (update.action === 'demote') {
            actionText = `Waduh, ${authorTag} memberhentikan ${targetTags} dari Admin.`;
            title = 'DEMOTED';
            body = 'Jabatan: Member';
        }

        if ((update.action === 'promote' || update.action === 'demote') && isSetInfoOn) {
            let ppUrl = null;
            try { ppUrl = await getProfilePicture(sock, targetJid); } catch { }

            await sock.sendWithThumbnail(jid, {
                text: `👥 *UPDATE PESERTA GRUP*\n\n${actionText}`,
                title, body,
                thumbnailUrl: ppUrl,
                sourceUrl: linkTargetThumbnail,
                mentions
            });

            await safeUpdateMetadata(sock, jid);
            return;
        }

        if (actionText && isSetInfoOn) {
            let ppUrl = null;
            try { ppUrl = await getProfilePicture(sock, targetJid); } catch { }

            await sock.sendWithThumbnail(jid, {
                text: `👥 *UPDATE PESERTA GRUP*\n\n${actionText}`,
                title, body,
                thumbnailUrl: ppUrl,
                sourceUrl: linkTargetThumbnail,
                mentions
            });
        }

        await safeUpdateMetadata(sock, jid);
    });
}

export async function handleGroupSystemMessages(sock, msg) {
    if (!msg?.key?.remoteJid?.endsWith('@g.us')) return;
    if (!msg.messageStubType && !msg.message?.protocolMessage) return;

    const jid = msg.key.remoteJid;
    const authorJid = msg.participant || msg.key.participant || msg.key.remoteJid;
    const authorTag = `@${authorJid.split('@')[0]}`;
    const protocol = msg.message?.protocolMessage;

    if (protocol && (protocol.type === 'MESSAGE_EDIT' || protocol.type === 14)) return;
}

async function safeUpdateMetadata(sock, jid) {
    try {
        if (typeof updateGroupMetadata === 'function') {
            await updateGroupMetadata(sock, jid);
        }
    } catch (err) { }
}
