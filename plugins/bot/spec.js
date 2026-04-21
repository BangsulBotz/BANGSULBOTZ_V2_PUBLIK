import { getServerInfo, parseMs } from '../../lib/utils.js';

export default {
    command: 'spec',
    description: 'Menampilkan informasi spesifikasi hardware dan sistem host.',
    typing: true,

    async execute(m, sock, args) {
        const info = getServerInfo();
        const bullet = '> ';

        const hardware = [
            bullet + 'cpu ' + info.cpu,
            bullet + 'RAM Total ' + info.ram.total
        ].join('\n');

        const software = [
            bullet + 'os ' + info.platformArch,
            bullet + 'hostname ' + info.hostname,
            bullet + 'node ' + info.nodeVersion
        ].join('\n');

        const system = [
            bullet + 'host runtime ' + info.uptime,
            bullet + 'ram usage ' + info.ram.used + ' used. ' + info.ram.free + ' free.',
            bullet + 'bot runtime ' + parseMs(process.uptime() * 1000)
        ].join('\n');

        let print = `*hardware*\n${hardware}\n\n*software*\n${software}\n\n*system*\n${system}`;

        if (info.disk) {
            const disk = [
                bullet + 'total ' + info.disk.total,
                bullet + 'used ' + info.disk.used,
                bullet + 'free ' + info.disk.free
            ].join('\n');
            print += `\n\n*disk*\n${disk}`;
        }

        await m.reply(print);
    }
};