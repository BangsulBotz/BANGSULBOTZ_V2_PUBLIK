import { db } from '../../database/db_user.js';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';

export default {
    command: 'totaluser',
    alias: ['listuser', 'alluser', 'userlist'],
    description: 'Mengekspor semua data user dari database ke format Excel via Stream.',
    onlyOwner: true,

    async execute(m, sock) {
        try {
            const users = db.prepare('SELECT jid, lid, name, status, reason, updated_at FROM users').all();

            if (users.length === 0) return m.reply("Database masih kosong.");

            await sock.sendMessage(m.chat, { 
                text: `sebentar yaa @${m.sender.split('@')[0]} 🤗 aku lagi nyusun excel nya nih, di tunggu yaaa 😇😇`,
                mentions: [m.sender]
            }, { quoted: m });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Daftar User');

            worksheet.columns = [
                { header: 'NO', key: 'no', width: 5 },
                { header: 'NAME', key: 'name', width: 25 },
                { header: 'JID', key: 'jid', width: 30 },
                { header: 'LID', key: 'lid', width: 30 },
                { header: 'STATUS', key: 'status', width: 15 },
                { header: 'REASON (BAN)', key: 'reason', width: 20 },
                { header: 'LAST UPDATE', key: 'updated_at', width: 25 }
            ];

            users.forEach((user, i) => {
                worksheet.addRow({
                    no: i + 1,
                    name: user.name || 'No Name',
                    jid: user.jid || '-',
                    lid: user.lid || '-',
                    status: (user.status || 'USER').toUpperCase(),
                    reason: user.reason || '-',
                    updated_at: user.updated_at 
                        ? new Date(user.updated_at * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) 
                        : '-'
                });
            });

            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    cell.alignment = { vertical: 'middle', horizontal: 'left' };
                });

                if (rowNumber === 1) {
                    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FF444444' } 
                    };
                    row.alignment = { vertical: 'middle', horizontal: 'center' };
                }
            });

            const stream = new PassThrough();
            const chunks = [];

            stream.on('data', (chunk) => chunks.push(chunk));
            
            await workbook.xlsx.write(stream);
            const buffer = Buffer.concat(chunks);

            const timeNow = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

            await sock.sendMessage(m.chat, {
                document: buffer, 
                fileName: `Daftar_User_${Date.now()}.xlsx`,
                mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                caption: `📊 *TOTAL USER DATABASE*\n\n◦ Terdeteksi: ${users.length} user\n◦ Waktu Ekspor: ${timeNow} WIB\n\n> _File dikirim via Stream Mode (Buffer)_`
            }, { quoted: m });

        } catch (err) {
            console.error(err);
            m.reply("Terjadi kesalahan saat mengekspor data via stream.");
        }
    }
};
