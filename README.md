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
- 🖼️ Thumbnail fleksibel — support landscape, portrait, dan kotak (bukan externalAdReply)
- 🗄️ SQLite database via better-sqlite3 (WAL mode, fast & efficient)
- 🔐 Auth session tersimpan di SQLite — tidak perlu `creds.json`
- 📢 Welcome & leave message dengan canvas image generatif
- 🛡️ Group log system (setinfo, ephemeral, promote, demote, foto grup, dll)
- 📦 Group metadata store — fetch sekali, update dari event (anti rate-limit)
- 📵 Anticall per grup
- 🔇 Antiprivate chat per grup
- 🔑 Trust system — berikan akses fitur tertentu ke user tertentu
- 🧹 Log bersih — bebas dari buffer session/Baileys noise, mudah debug

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

## 🗄️ Struktur Database

```
./database/
├── database/
│   └── bot_db.json         ← data fitur per grup (welcome, setinfo, anticall, trust, dll)
└── store/                  ← raw message store
```

```
./session/
└── auth.db                 ← session auth Baileys (SQLite, jangan dihapus)
```

Semua file auto-create jika belum ada ✅

Session auth tersimpan permanen di `auth.db`. Tidak perlu backup `creds.json` — cukup jaga file tersebut agar tidak terhapus.

---

## 📦 Group Metadata Store

Bot hanya melakukan fetch penuh ke WhatsApp **satu kali** — saat pesan pertama dari grup tersebut masuk. Setelah itu metadata disimpan di store (Map in-memory) dan tidak di-fetch ulang ke WA.

Pembaruan store dilakukan secara lokal berdasarkan event yang masuk:

| Event | Aksi di Store |
|---|---|
| `group-participants.update` | Update daftar member (add/remove/promote/demote) |
| `groups.update` | Update nama, deskripsi, pengaturan grup |
| `chats.update` | Update ephemeral setting |

Ini mencegah `rate-overlimit` akibat terlalu sering request metadata ke server WA.

---

## 🖼️ Thumbnail System

Bot menggunakan wrapper thumbnail custom — **bukan** `externalAdReply` bawaan Baileys yang terbatas landscape saja.

Thumbnail mendukung tiga mode tampilan:

- **Landscape** — gambar horizontal biasa
- **Portrait** — gambar vertikal penuh
- **Kotak** — aspek rasio 1:1

Thumbnail dan favicon dipilih acak dari daftar di `settings.js`. Bisa tambah URL sebanyak yang diinginkan di array `thumbnailUrls` dan `faviconUrl`.

---

## 📢 Group Event System

Semua fitur grup bisa diatur **per grup** menggunakan command yang tersedia.

| Event | Fitur yang perlu aktif |
|---|---|
| Member join / leave (+ canvas image) | `welcome` atau `setinfo` |
| Ganti nama, deskripsi, pengaturan grup | `setinfo` |
| Promote / demote admin | `setinfo` |
| Perubahan ephemeral (pesan sementara) | `setinfo` |
| Ganti foto profil grup | `setinfo` |
| Perubahan label member | `setinfo` |
| Tolak panggilan masuk | `anticall` |
| Tolak pesan dari private chat | `antiprivate` |

---

## 🔑 Trust System

Owner dapat memberikan kepercayaan kepada user tertentu untuk mengakses fitur spesifik yang biasanya dibatasi.

| Command | Fungsi |
|---|---|
| `trust @user fitur` | Berikan akses fitur tertentu ke user |
| `untrust @user fitur` | Cabut akses fitur dari user |
| `listtrust` | Lihat daftar user beserta fitur yang dipercaya |

Cara kerja: user yang di-trust hanya bisa menggunakan fitur yang secara eksplisit diberikan. Di luar fitur tersebut, akses tetap dibatasi seperti biasa. Cocok untuk mendelegasikan akses tanpa menjadikan user sebagai owner penuh.

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
- File `auth.db` adalah satu-satunya file yang perlu dijaga untuk session

---

## 👑 Credit

💻 Developer: **BangsulBotz**

- 🔗 Repo: [github.com/BangsulBotz/BANGSULBOTZ_V2_PUBLIK](https://github.com/BangsulBotz/BANGSULBOTZ_V2_PUBLIK)
- 👥 Grup: [Furry Angelina — Join Sekarang](https://chat.whatsapp.com/HjDJzwSBZQW0cLYbJorXP2)

---

## ⭐ Support

Kalau suka project ini:

- ⭐ Star repo
- 🍴 Fork
- 🛠️ Contribute
- 👥 Join grup untuk diskusi & update

---

**🔥 BANGSULBOTZ — Simple tapi mematikan.**
