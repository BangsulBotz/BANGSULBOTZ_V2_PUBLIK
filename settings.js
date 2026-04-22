import { getRandomThumb, getRandomFavicon, getRandomThumbnailName, getRandomFaviconName } from './database/db_thumbnails.js';
const config = {
    ownerName: "ghofar",
    owner: "6281234567890",  //nomor owner
    botName: "bangsulbotz",
    botNumber: "6281234567890",  //nomor bog nya wajib di isi. 
    prefixes: [".", "#", "!", "/"],
    pairing: true,
    noprefix: true,
    customPairing: "AWIKAWOK",
    debugRawJson: false,
    version: "2.0",
    packname: "Bot Whatsapp",
    author: "BangsulStart",

    //========== [RESPON PESAN] ==========
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

    //========== [URL PROFILE] ==========
    my: {
        gh: 'https://github.com/BangsulBotz',
        grup: 'https://chat.whatsapp.com/DgQGzTAjLQZ7BPpboCyh1k?mode=gi_t'
    },

    //========== [URL TARGET THUMBNAIL] ==========
    sourceUrl: 'https://github.com/BangsulBotz',

    //apikey gemini
    apiKeys: ['xxx','xxx','xxx'],

    //========== [URL THUMBNAIL] ==========
    thumbnailUrls: [
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail2.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail3.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail4.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail5.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail6.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail7.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail8.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail9.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail10.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail11.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail12.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail13.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail14.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail15.jpg',
        'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnail16.jpg'
    ],

    //========== [URL FAVICON] ========== saran ganti url ya, soal nya url favicon ini nge blok IP tertentu. bebas pakai url gambar apa aja.
    faviconUrl:[
        'https://cloud.yardansh.com/0Rbk8e.png',
        'https://cloud.yardansh.com/3m4Sad.png',
        'https://cloud.yardansh.com/MCSgh9.png',
        'https://cloud.yardansh.com/XX91O8.png'
    ],


    //========== [ URL THUMBNAIL INFO ] ==========
    thumbnail_Blocked : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/blocked.jpg',
    thumbnail_Unblocked : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/unblocked.jpg',
    thumbnail_botself : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/BotSelf.jpeg',
    thumbnail_botunself : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/BotPublic.jpeg',
    thumbnail_selfgc : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/GroupSelf.jpeg',
    thumbnail_grupunself : 'https://raw.githubusercontent.com/BangsulBotz/thumbnailku/main/GroupUnmute.jpeg',
    thumbnail_grupset : 'https://raw.githubusercontent.com/BANGSULSTAR/thumbnail/main/thumbnailgrupsetting.jpg',

    //ambil url radnom dari "thumbnailUrls"
    get thumbnail() {
        return this.thumbnailUrls[Math.floor(Math.random() * this.thumbnailUrls.length)];
    },

    //ambil random data thumbnail dari db
    get randomThumbnail() {
        return getRandomThumbnailName() ?? "Tidak ada data";
    },

    //ambil random data favicon dari db
    get randomFavicon() {
        return getRandomFaviconName() ?? "Tidak ada data";
    },

    //ambil nama random thumbnail dari db
    get randomThumbnailName() {
        return getRandomThumbnailName() ?? null;
    },

    //amnil nama random favicon dari db
    get randomFaviconName() {
        return getRandomFaviconName() ?? null;
    }

}

export default config;

// --- [ DATABASE LOGIC ] ---
import fs from 'fs';
import path from 'path';
const dbPath = path.join(process.cwd(), 'database', 'database', 'bot_db.json');
const loadBotDb = () => {
    try {
        if (!fs.existsSync(dbPath)) {
            const dir = path.dirname(dbPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const init = {
                botSettings: { self: false, anticall: false, antipc: false },
                trusted: []
            };
            fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
            return init;
        }
        return JSON.parse(fs.readFileSync(dbPath));
    } catch (e) {
        console.error("Gagal memuat bot_db.json, menggunakan data default.");
        return { botSettings: { self: false, anticall: false, antipc: false }, trusted: [], afk: {} };
    }
};
global.botDb = loadBotDb();
global.saveBotDb = () => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(global.botDb, null, 2));
        return true;
    } catch (e) {
        console.error("Gagal menyimpan database ke JSON:", e);
        return false;
    }
};

console.log("✅ Global settings & Database telah dimuat.");
console.log("Global settings telah dimuat.");
