import axios from 'axios';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
    'Connection': 'keep-alive'
};

const getWIBTime = (date = new Date()) => {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).format(date).replace(/\./g, ':') + ' WIB';
};

//tourl - Uguu
export const Uguu = async (buffer) => {
    const ft = await fileTypeFromBuffer(buffer) || { ext: 'bin' };
    const form = new FormData();
    form.append('files[]', buffer, { filename: `file.${ft.ext}` });
    const { data } = await axios.post('https://uguu.se/upload.php', form, {
        headers: form.getHeaders()
    });

    const expiryDate = new Date(Date.now() + 3 * 60 * 60 * 1000); 
    return {
        url: data.files[0].url,
        expiry: getWIBTime(expiryDate),
        uploadDate: getWIBTime()
    };
};

//tourl - Yardansh Cloud (No Expired)
export const Yardansh = async (buffer) => {
    try {
        const ft = await fileTypeFromBuffer(buffer) || { ext: 'bin', mime: 'application/octet-stream' };
        const form = new FormData();

        form.append('file', buffer, {
            filename: `yardansh_${Date.now()}.${ft.ext}`,
            contentType: ft.mime
        });

        const { data } = await axios.post('https://cloud.yardansh.com/upload', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
            }
        });

        if (!data || !data.url) return null;

        return {
            url: data.url,
            expiry: '∞ Non-Expired',
            uploadDate: getWIBTime()
        };
    } catch (err) {
        console.error('[YARDANSH] Error:', err.message);
        return null;
    }
};

//shorturl tinyurl
export const tinyurl = async (url) => {
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        return res.data;
    } catch {
        return null;
    }
};

//shorturl isgd
export const isgd = async (url) => {
    try {
        const res = await axios.get(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`, { headers, timeout: 10000 });
        return res.data?.shorturl || null;
    } catch {
        return null;
    }
};
