---

# **🤖 BANGSULBOTZ V2 PUBLIC**

_Bot WhatsApp multi-fitur berbasis Node.js menggunakan Baileys.
Simple, modular (plugin system), dan mudah dikembangkan 🚀_

---

## ✨ Features
- 🔌 Plugin system (modular command)
- ⚡ Fast & lightweight
- 🎯 Custom prefix & no-prefix mode
- 👑 Owner & admin control
- 🧠 Support API (Gemini dll)
- 🖼️ Random thumbnail & favicon system
- 💾 JSON database (simple & portable)

---

## 📦 Installation
> Clone repository:
```bash
git clone https://github.com/FgsiDev/BANGSULBOTZ_V2_PUBLIK
cd BANGSULBOTZ_V2_PUBLIK
```
> Install dependencies:
```bash
npm install
```
> Run bot:
```bash
node .
```

---

## ⚙️ Configuration
> Edit file setting.js

```js
import { getRandomThumb, getRandomFavicon, getRandomThumbnailName, getRandomFaviconName } from './database/db_thumbnails.js';

const config = {
    ownerName: "ghofar",
    owner: "6282268881337",
    botName: "bangsulbotz",
    botNumber: "6281266021317",
    prefixes: [".", "#", "!", "/"],
    pairing: true,
    noprefix: true,
    customPairing: "AWIKAWOK",
    debugRawJson: false,
    version: "2.0",
    packname: "Bot Whatsapp",
    author: "BangsulStart",

    pesan: {
        wait: "Sedang diproses, mohon tunggu sebentar ya kak... ⏳",
        editing: "Sedang mengolah data... 🔄",
        error: "Terjadi kesalahan 😥 Coba lagi nanti ya.",
        done: "Berhasil dilakukan ✓",
        ownerOnly: "Fitur ini khusus owner bot!",
        groupOnly: "Fitur ini hanya bisa digunakan di grup!",
        privateOnly: "Fitur ini hanya bisa digunakan di private chat!",
        adminOnly: "Fitur ini hanya untuk Admin grup!",
        botAdmin: "Bot harus menjadi Admin untuk menjalankan perintah ini!"
    },

    my: {
        gh: 'https://github.com/BangsulBotz',
        grup: 'https://chat.whatsapp.com/DgQGzTAjLQZ7BPpboCyh1k?mode=gi_t'
    },

    sourceUrl: 'https://github.com/BangsulBotz',

    apiKeys: ['xxx','xxx','xxx'],

    thumbnailUrls: [
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail2.jpg'
    ],

    faviconUrl:[
        'https://cloud.yardansh.com/0Rbk8e.png'
    ]
}

export default config;
```

---

## 🧠 Database System
> Bot menggunakan database JSON sederhana:
```txt 
/database/database/bot_db.json
```
Auto create jika belum ada ✅

---

## 🔌 Plugin System
_Semua command menggunakan sistem plugin modular._
> 📁 Contoh Plugin

```js
export default {
    command: 'example',
    alias: ['.test', '.format'],
    description: 'Deskripsi fitur.',
    help: '`<teks>`',

    onlyOwner: false,
    onlyGroup: false,
    onlyPrivate: false,
    onlyAdmin: false,
    onlyBotAdmin: false,

    typing: true,
    wait: true,
    message_done: true,

    async execute(m, sock, args, allPlugins) {
        const text = args.join(' ');

        let respon = `Halo ${m.pushName}!
Command: ${m.prefix}${m.command}`;

        await m.reply(respon);
    }
};
```

---

## 🚀 Menjalankan Bot
```bash
node .
```
_Scan QR / gunakan pairing code sesuai config 🔑_

---

## ⚠️ Notes
- Pastikan nomor bot aktif
- Gunakan VPS agar bot stabil 24/7
- Ganti API key jika diperlukan
- Hindari spam agar tidak kena banned

---

## 👑 Credit

> 💻 Developer: BangsulBotz
- 🔗 Repo: https://github.com/BangsulBotz/BANGSULBOTZ_V2_PUBLIK

---

## ⭐ Support
*Kalau suka project ini:*
- ⭐ Star repo
- 🍴 Fork
- 🛠️ Contribute

---

**🔥 BANGSULBOTZ — Simple tapi mematikan.**
