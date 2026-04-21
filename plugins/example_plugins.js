/**
 * TEMPLATE PLUGIN MASTER - BANGSULBOTZ
 * Gunakan file ini sebagai acuan saat membuat fitur baru.
 */

// --- [ IMPORT SECTION ] ---
// Letakkan semua modul yang dibutuhkan di luar "export default"
// Contoh Import Modul NPM (External):
// import axios from 'axios'; 
// import cheerio from 'cheerio';

// Contoh Import File Lokal (Internal):
// import { printServerInfo } from '../lib/utils.js';
// import { db } from '../database/db_raw_messages.js';

export default {
    // --- [ BASIC INFORMATION ] ---
    command: 'example',               // Command utama (tanpa prefix)
    alias: ['.test', '.format'],        // Nama lain untuk memicu fitur ini
    description: 'Deskripsi fitur.',   // Penjelasan singkat fungsi fitur
    help: '`<teks>`',                 // Cara penggunaan yang muncul di help

    // --- [ CONFIGURATION FLAGS ] ---
    onlyOwner: false,    // Jika true: Fitur hanya bisa digunakan oleh nomor Owner yang terdaftar
    onlyGroup: false,    // Jika true: Fitur akan ditolak jika digunakan di Private Chat
    onlyPrivate: false,  // Jika true: Fitur akan ditolak jika digunakan di dalam Grup
    onlyAdmin: false,    // Jika true: Hanya Admin grup yang bisa memicu (khusus di Grup)
    onlyBotAdmin: false, // Jika true: Bot harus jadi Admin dulu agar fitur ini mau jalan
    
    // --- [ AUTO FEATURES (LOGIC IN INDEX.JS) ] ---
    typing: true,        // Jika true: Bot otomatis memunculkan status "sedang mengetik..."
    wait: true,          // Jika true: Bot otomatis mengirim pesan "Tunggu sebentar..." di awal proses
    message_done: true,  // Jika true: Bot otomatis mengirim pesan "Selesai" jika fungsi execute() sukses
    
    // --- [ PREMIUM / LIMIT SYSTEM (OPSIONAL) ] ---
    // premium: false,   // Bisa kamu tambahkan sendiri logikanya jika ingin fitur khusus premium
    // limit: false,     // Bisa kamu tambahkan jika ingin fitur yang memotong limit user

    /**
     * @param {Object} m - Objek pesan hasil serialize (handler.js)
     * - m.id : ID Unik pesan
     * - m.chat : JID tujuan (misal: 123@g.us atau 456@s.whatsapp.net)
     * - m.sender : JID pengirim pesan
     * - m.pushName : Nama profil pengirim
     * - m.isGroup : Mengecek apakah pesan berasal dari grup
     * - m.isOwner : Mengecek apakah pengirim adalah owner
     * - m.isAdmin : Mengecek apakah pengirim adalah admin (khusus grup)
     * - m.isBotAdmin : Mengecek apakah bot adalah admin (khusus grup)
     * - m.text / m.body : Teks lengkap pesan
     * - m.prefix : Simbol prefix yang sedang aktif
     * - m.command : Nama command yang sedang dijalankan
     * - m.quoted : Data pesan yang di-reply (mimetype, teks, sender, dll)
     * - m.reply() : Fungsi instan untuk membalas pesan di chat yang sama
     * * @param {Object} sock - Koneksi utama Socket Baileys
     * - sock.sendMessage() : Mengirim pesan (teks, gambar, video, audio, dsb)
     * - sock.user : Data akun bot (ID, nama, dll)
     * - sock.decodeJid() : Membersihkan JID dari karakter aneh
     * * @param {Array} args - Argumen pesan. Contoh: ".fitur satu dua" -> ["satu", "dua"]
     * @param {Map} allPlugins - Database semua plugin yang sedang aktif (Map object)
     */
    async execute(m, sock, args, allPlugins) {
        
        // 1. Mengolah Argumen (Input User)
        const text = args.join(' ');

        // 2. Mengambil Data Pesan Yang Di-Reply (Jika ada)
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        // 3. Logika Utama
        // Contoh pemanggilan modul yang sudah di-import:
        // const data = await axios.get('https://api.example.com');
        
        let respon = `*Halo ${m.pushName}!*
        
Anda menggunakan command: *${m.prefix}${m.command}*

*Status Akses:*
- Owner: ${m.isOwner ? '✅' : '❌'}
- Admin: ${m.isAdmin ? '✅' : '❌'}
- Bot Admin: ${m.isBotAdmin ? '✅' : '❌'}`;

        // 4. Mengirim Balasan
        // Jika message_done: true di atas, bot akan mengirim pesan "Done" otomatis setelah ini.
        await m.reply(respon);
    }
};