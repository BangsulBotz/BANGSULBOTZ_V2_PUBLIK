import { getUserData } from '../../database/db_user.js';

export default {
    command: 'listadmin',
    alias: ['adminlist', 'admins'],
    description: 'Menampilkan daftar admin grup dengan detail JID dan LID.',
    onlyGroup: true,
    typing: true,

    async execute(m, sock) {
        const groupMetadata = m.groupMetadata;
        const participants = groupMetadata.participants;
        
        const admins = participants.filter(p => p.admin !== null);

        const tableRows = [
            { 
                is_header: true, 
                cells: ["No", "Role", "Nama", "JID", "LID"] 
            },
            ...admins.map((admin, index) => {
                const userData = getUserData(admin.id);
                const name = userData ? userData.name : "User";
                const role = admin.admin === 'superadmin' ? 'Owner 👑' : 'Admin';
                
                const cleanJid = admin.phoneNumber ? admin.phoneNumber.split('@')[0] : "-";
                const cleanLid = admin.id ? admin.id.split('@')[0] : "-";

                return {
                    is_header: false,
                    cells: [
                        String(index + 1),
                        role,
                        name,
                        cleanJid,
                        cleanLid
                    ]
                };
            })
        ];

        // GenAI JSON (base64 source)
        const genAIJson = {
            "response_id": "d66ef6ea-6367-4580-ba56-fd05278fdbfc",
            "sections": [
                {
                    "view_model": {
                        "primitive": {
                            "text": `👑 *DAFTAR ADMIN GRUP*\n\n📛 *Grup:* ${groupMetadata.subject}\n👥 *Total:* ${admins.length} Admin`,
                            "__typename": "GenAIMarkdownTextUXPrimitive"
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    }
                },
                {
                    "view_model": {
                        "primitive": {
                            "rows": tableRows,
                            "__typename": "GenATableUXPrimitive"
                        },
                        "__typename": "GenAISingleLayoutViewModel"
                    }
                }
            ]
        };

        const base64Data = Buffer.from(JSON.stringify(genAIJson)).toString('base64');

        // Struktur pesan sesuai dump terbaru
        await sock.relayMessage(m.chat, {
            messageContextInfo: {
                threadId: [],
                messageSecret: "rZDK/lryu2I27Y1kNUQquk0kG9ZY3xxfa50Bfl/jpRY=",
                botMetadata: {
                    verificationMetadata: {
                        proofs: [
                            {
                                certificateChain: [
                                    "MIICqDCCAk6gAwIBAgIUanDqi6IxmTXBCUWkgrquLSrRazowCgYIKoZIzj0EAwIweTEiMCAGA1UEAwwZTWV0YSBXQSBTUyBJbnQgQ0EgMjAyNS0wOTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEzARBgNVBAcMCk1lbmxvIFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1zIEluYy4wHhcNMjYwNDA3MTgzMzIyWhcNMjYwNDExMTgzMzMyWjAeMRwwGgYDVQQDDBNzdmM6d2EtYm90LW1zZy1sZWFmMCowBQYDK2VwAyEAXEiNZO0IHAjqZxoPoryDxciEx4EIinsC4w4a9+3kMKGjggE8MIIBODALBgNVHQ8EBAMCB4AwHQYDVR0OBBYEFLY2YtY65ivNynyCzs8Mft4W+GCxMIG0BgNVHSMEgawwgamAFO81YRGUWbuc0xuufO+lFiYAOjGOoXukeTB3MSAwHgYDVQQDDBdNZXRhIFdBIEZlYXR1cmUgUm9vdCBDQTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEzARBgNVBAcMCk1lbmxvIFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1zIEluYy6CFEZvL5Zv8AJ8duOmVC+Foy7F4yg7MFMGCysGAQQBgsAVAgIQBEQMQlVSSTptcmw6Ly9jZXJ0aWZpY2F0ZV9zZXJ2aWNlLndoYXRzYXBwX3NpbXBsZV9zaWduYWwvU2VyaWFsTnVtYmVyczAKBggqhkjOPQQDAgNIADBFAiEAo7yHWk58RsnLoU1n7KlzZ5IwKe0UPUoftnoDiUBxymgCIDZtur3RkBVRhqrvNgdgKiD7SlVkfgHneCXs9MYaON3Q",
                                    "MIIDeDCCAx2gAwIBAgIURm8vlm/wAnx246ZUL4WjLsXjKDswCgYIKoZIzj0EAwIwdzEgMB4GA1UEAwwXTWV0YSBXQSBGZWF0dXJlIFJvb3QgQ0ExCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRMwEQYDVQQHDApNZW5sbyBQYXJrMRwwGgYDVQQKDBNNZXRhIFBsYXRmb3JtcyBJbmMuMB4XDTI1MDkwNDE4MDU0OVoXDTI3MDkwNDE4MDU0OVoweTEiMCAGA1UEAwwZTWV0YSBXQSBTUyBJbnQgQ0EgMjAyNS0wOTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEzARBgNVBAcMCk1lbmxvIFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1zIEluYy4wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATs+c+UVhvMBZzu4AHndKKTZASPLp2vUt1g84aUpdOFqmqCs5KEJ8Sxhi8F9GX4P7rPLjfOwfFJRA6yrp+2cX0zo4IBgzCCAX8wHQYDVR0OBBYEFO81YRGUWbuc0xuufO+lFiYAOjGOMIG0BgNVHSMEgawwgamAFNO7KMTVSYUxkL6VS3LyWJw7m76zoXukeTB3MSAwHgYDVQQDDBdNZXRhIFdBIEZlYXR1cmUgUm9vdCBDQTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEzARBgNVBAcMCk1lbmxvIFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1zIEluYy6CFALbuULsZlYXxk/Cz5I35uNJkpdAMA4GA1UdDwEB/wQEAwIBhjASBgNVHRMBAf8ECDAGAQH/AgEAMEUGA1UdHwQ+MDwwOqA4oDaGNGh0dHBzOi8vbWV0YS5wdWJsaWNrZXlpbmZyYS5jb20vYXJsL3doYXRzYXBwX2ZlYXR1cmUwIAYIKwYBBQUHAQEEFDASMBAGCCsGAQUFBzABhgROb25lMBoGCWCGSAGG+EIBDQQNFgtPbmNhbGw6IHBraTAKBggqhkjOPQQDAgNJADBGAiEAq7Ycf2W/cSA2Ni3L0sgYmPmlRxkPcMgOm+ZRgkiQsdwCIQD2XRUvySFSRYJSfyQW2m4ka8N9gJ8KRMD1KTwyXghXHQ=="
                                ],
                                version: 1,
                                useCase: 1,
                                signature: "wE60E21qLljSz/NWatxVHzotyiEemBXXIJwwLsFVvn/Xei44+18x9ZSp5g2IsUzqCx8ACk4QUskF1bj7mVqIAQ=="
                            }
                        ]
                    }
                }
            },
            botForwardedMessage: {
                message: {
                    richResponseMessage: {
                        submessages: [
                            {
                                messageType: 2,
                                messageText: `👑 *DAFTAR ADMIN GRUP*\n\n📛 *Grup:* ${groupMetadata.subject}\n👥 *Total:* ${admins.length} Admin`
                            },
                            // Tabel
                            {
                                messageType: 4,
                                tableMetadata: {
                                    rows: tableRows.map(r => ({
                                        items: r.cells,
                                        isHeading: r.is_header
                                    }))
                                }
                            }
                        ],
                        messageType: 1,
                        unifiedResponse: {
                            data: base64Data
                        },
                        contextInfo: {
                            mentionedJid: [],
                            groupMentions: [],
                            statusAttributions: [],
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedAiBotMessageInfo: {
                                botJid: "867051314767696@bot"
                            },
                            forwardOrigin: 4
                        }
                    }
                }
            }
        }, {});

    }
};