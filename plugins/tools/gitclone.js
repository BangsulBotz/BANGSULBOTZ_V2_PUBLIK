import axios from 'axios';

export default {
  command: 'gitclone',
  alias: ['git', 'clonegit'],
  help: '`<url/user/repo>`',
  description: 'Unduh repo GitHub jadi ZIP via Direct Stream',
  onlyOwner: false,
  typing: true,

  execute: async (m, sock, args) => {
    let text = '';

    if (m.quoted && m.quoted.text) {
      text = m.quoted.text;
    } else {
      text = args.join(' ');
    }

    if (!text.trim()) {
      return m.reply(
        `Contoh:\n${m.prefix}${m.command} nazedev/hitori\n` +
        `atau reply pesan lalu ketik ${m.prefix}git`
      );
    }

    const cmdRegex = new RegExp(`^(${m.prefix})?(gitclone|git|clonegit)\\s*`, 'i');
    text = text.replace(cmdRegex, '').trim();

    const urlRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9][a-zA-Z0-9-]{0,38})\/([a-zA-Z0-9._-]{1,100})(?:\.git)?/i;
    const repoRegex = /([a-zA-Z0-9][a-zA-Z0-9-]{0,38})\/([a-zA-Z0-9._-]{1,100})/i;
    
    let match = text.match(urlRegex) || text.match(repoRegex);

    if (!match) return m.reply('Tidak menemukan username/repo di pesan');

    let [, user, repo] = match;
    repo = repo.split(/[?#@]/)[0].replace(/\.git$/i, '').trim();

    if (!user || !repo) return m.reply('Username atau repo tidak valid');

    const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;
    const repoUrl = `https://github.com/${user}/${repo}`;
    const repoThumbnail = `https://opengraph.githubassets.com/0/${user}/${repo}`;

    try {
      await axios.head(zipUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0' } 
      });

      await sock.sendMessage(m.chat, {
        document: { url: zipUrl },
        fileName: `${repo}.zip`,
        mimetype: 'application/zip',
        caption: `*Repo:* ${user}/${repo}\n🔗 ${repoUrl}`,
        
      }, { quoted: m });

      await sock.sendReact(m.chat, '✅', m.key);

    } catch (e) {
      const msg = e.response?.status === 404
        ? 'Repo tidak ditemukan atau bersifat private'
        : 'Gagal memproses permintaan (Server Error)';
      
      await m.reply(msg);
      await sock.sendReact(m.chat, '❌', m.key);
      console.error(e);
    }
  }
};