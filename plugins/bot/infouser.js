import { db, getUserData, normalizeJid } from '../../database/db_user.js';
import { generateWAMessageFromContent } from 'baileys';

export default {
    command: 'infouser',
    alias: ['uinfo', 'userinfo', 'cekuser'],
    description: 'Menampilkan informasi user dengan format rapi dan tombol salin.',
    help: '`(reply/tag)`',
    typing: true,

    async execute(m, sock, args, allPlugins) {
        let textInput = args[0] ? args[0] : (m.quoted ? m.quoted.sender : m.sender);
        
        if (textInput.startsWith('@') && !textInput.endsWith('@s.whatsapp.net') && !textInput.endsWith('@lid')) {
            textInput = textInput.replace('@', '') + '@lid';
        }

        let targetId = m.mentions?.[0] || normalizeJid(textInput);
        const data = getUserData(targetId);

        if (!data) {
            return m.reply("User tidak ditemukan di database.");
        }

        const pn = data.jid ? data.jid.split('@')[0] : '-';
        const isBanned = data.status === 'blacklisted';

        const trustedFromSQL = db.prepare(`
            SELECT command 
            FROM trusted_commands 
            WHERE jid = ? OR jid = (SELECT jid FROM users WHERE lid = ?)
        `).all(data.jid, data.lid);

        let bodyText = `\`\`\`
◦ Name: ${data.name}
◦ Number: ${pn}
◦ JID: ${data.jid || '-'}
◦ LID: ${data.lid || '-'}
◦ Status: ${data.status.toUpperCase()}
◦ Banned: ${isBanned ? 'YA ❌' : 'TIDAK ✅'}\`\`\``;
        
        if (isBanned && data.reason) {
            bodyText += `\n◦ *Reason:* _${data.reason}_`;
        }

        bodyText += `\n\n📋 *TRUSTED ACCESS*\n`;
        if (trustedFromSQL.length > 0) {
            trustedFromSQL.forEach((t, i) => {
                const plugin = [...allPlugins.values()].find(p => p.command === t.command || p.alias?.includes(t.command));
                const aliases = plugin?.alias?.length ? plugin.alias.join(', ') : null;
                
                bodyText += `\`${t.command}\`\n`;
                if (aliases) {
                    bodyText += `> _${aliases}_\n`;
                }
            });
        } else {
            bodyText += `_Tidak ada akses khusus._\n`;
        }

        if (data.updated_at) {
            const lastSeen = new Date(data.updated_at * 1000).toLocaleString('id-ID', {
                timeZone: 'Asia/Jakarta',
                dateStyle: 'medium',
                timeStyle: 'short'
            });
            bodyText += `\n🕒 *Last Update:* ${lastSeen} WIB`;
        }

        try {
            const msgs = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                title: "USER DETAILED INFO",
                                hasMediaAttachment: false
                            },
                            body: {
                                text: bodyText
                            },
                            footer: {
                                text: "Gunakan tombol di bawah untuk menyalin"
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Copy Name",
                                            copy_code: data.name
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Copy Number",
                                            copy_code: pn
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Copy JID",
                                            copy_code: data.jid || ''
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Copy LID",
                                            copy_code: data.lid || ''
                                        })
                                    }
                                ],
                                messageVersion: 1
                            }
                        }
                    }
                }
            }, { quoted: m });

            await sock.relayMessage(m.chat, msgs.message, {
                messageId: msgs.key.id,
                additionalNodes: [
                    {
                        tag: "biz",
                        attrs: {},
                        content: [
                            {
                                tag: "interactive",
                                attrs: { type: "native_flow", v: "1" },
                                content: [
                                    {
                                        tag: "native_flow",
                                        attrs: { v: "9", name: "mixed" }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

        } catch (err) {
            console.error(err);
            await m.reply(bodyText);
        }
    }
};