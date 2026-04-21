import { generateWAMessageFromContent } from 'baileys'

export default {
    command: 'idgc',
    alias: ['cekidgc', 'getidgc', 'getidgroup', 'gid'],
    description: 'Tampilkan ID grup dengan tombol salin.',
    onlyGroup: true,
    execute: async (m, sock) => {
        const groupId = m.chat;
        const groupName = m.groupMetadata?.subject || 'Grup Tanpa Nama';

        try {
            const bodyText = `📌 *Nama Grup*: ${groupName}\n🔹 *ID Grup*: ${groupId}`;
            const footerText = 'Gunakan tombol di bawah untuk menyalin ID';

            const msgs = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: {
                                title: "📍 Info Group ID",
                                hasMediaAttachment: false
                            },
                            body: {
                                text: bodyText
                            },
                            footer: {
                                text: footerText
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "📋 Salin ID Grup",
                                            id: "copy_gcid",
                                            copy_code: groupId
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
            await sock.sendMessage(m.chat, {
                text: `Gagal mengirim ID: ${err.message}`
            }, { quoted: m });
        }
    }
};