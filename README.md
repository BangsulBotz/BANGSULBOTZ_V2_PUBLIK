# 🤖 BANGSULBOTZ V2 PUBLIC

_Bot WhatsApp multi-fitur berbasis Node.js menggunakan Baileys original (npm).
Fast response, modular plugin system, dan siap pakai. 🚀_

> 👥 **Gabung Grup Support:**
> [chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2](https://chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2)

---

## ✨ Features

- 🔌 Plugin system (modular command)
- ⚡ Fast & lightweight — Baileys original (npm)
- 🎯 Custom prefix & no-prefix mode
- 👑 Owner & admin control
- 🧠 Support API (Gemini, dll)
- 🖼️ Random thumbnail & favicon system (support portrait & favicon)
- 🗄️ SQLite database via better-sqlite3 (fast, efficient, WAL mode)
- 🔐 Auth session tersimpan di SQLite — tidak perlu creds.json
- 📢 Welcome & leave message dengan canvas image
- 🛡️ Group log system (setinfo, ephemeral, promote, demote, dll)

---

## 📦 Installation

Clone repository:

```bash
git clone https://github.com/FgsiDev/BANGSULBOTZ_V2_PUBLIK
cd BANGSULBOTZ_V2_PUBLIK
```

Install dependencies:

```bash
npm install
```

Jalankan bot:

```bash
node .
```

---

## ⚙️ Configuration

Edit file `settings.js`:

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
        grup: 'https://chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2'
    },
    sourceUrl: 'https://github.com/BangsulBotz',
    apiKeys: ['xxx', 'xxx', 'xxx'],
    thumbnailUrls: [
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail2.jpg'
    ],
    faviconUrl: [
        'https://cloud.yardansh.com/0Rbk8e.png'
    ]
}

export default config;
```

---

## 🗄️ Database System

Bot menggunakan dua sistem database:

**SQLite** — untuk session auth Baileys:
```
/session/auth.db
```

**JSON** — untuk data bot (grup, fitur, dll):
```
/database/database/bot_db.json
```

Keduanya auto-create jika belum ada ✅

Session auth tersimpan permanen di SQLite. Tidak perlu backup `creds.json` secara manual — cukup jaga file `auth.db`.

---

## 🔌 Plugin System

Semua command menggunakan sistem plugin modular. Tambah command baru cukup buat file baru di folder plugins.

Contoh plugin:

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
        let respon = `Halo ${m.pushName}!\nCommand: ${m.prefix}${m.command}`;
        await m.reply(respon);
    }
};
```

---

## 🖼️ Thumbnail System

Bot mendukung thumbnail dinamis dengan dua mode:

- **Portrait thumbnail** — gambar vertikal untuk tampilan penuh
- **Favicon thumbnail** — ikon kecil dari URL sumber

Thumbnail dipilih secara acak dari daftar yang ada di `settings.js`. Bisa tambah URL sebanyak yang diinginkan di array `thumbnailUrls` dan `faviconUrl`.

---

## 📢 Group Event System

Bot otomatis mengirim notifikasi untuk event grup berikut (jika fitur diaktifkan):

| Event | Fitur |
|---|---|
| Member join / leave (+ canvas image) | `welcome` atau `setinfo` |
| Ganti nama, deskripsi, foto grup | `setinfo` |
| Promote / demote admin | `setinfo` |
| Pesan sementara (ephemeral) | `setinfo` |
| Perubahan label member | `setinfo` |

Aktifkan per grup dengan command `.setwelcome` dan `.setinfo`.

---

## 🚀 Menjalankan Bot

```bash
node .
```

Scan QR atau gunakan pairing code sesuai config. Setelah terhubung, session tersimpan otomatis di `auth.db` dan tidak perlu scan ulang selama file tidak dihapus.

---

## ⚠️ Notes

- Pastikan nomor bot aktif dan tidak sedang digunakan di perangkat lain
- Gunakan VPS agar bot stabil 24/7
- Ganti API key jika diperlukan
- Hindari spam agar tidak kena banned WhatsApp
- Jangan hapus folder `/session` — berisi data login bot

---

## 👑 Credit

💻 Developer: **BangsulBotz**

- 🔗 Repo: [github.com/BangsulBotz/BANGSULBOTZ_V2_PUBLIK](https://github.com/BangsulBotz/BANGSULBOTZ_V2_PUBLIK)
- 👥 Grup: [Furry Angelina](https://chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2)

---

## ⭐ Support

Kalau suka project ini:

- ⭐ Star repo
- 🍴 Fork
- 🛠️ Contribute
- 👥 Join grup untuk diskusi & update

---

**🔥 BANGSULBOTZ — Simple tapi mematikan.**
