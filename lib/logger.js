const originalLog = console.log;
const originalInfo = console.info;
const originalDebug = console.debug;
const isBlacklist = new Set([
    'Closing session',
    'SessionEntry',
    'incoming prekey bundle',
    'Closing open session'
]);

const filterLogs = (args) => {
    const fullMsg = args.map(arg => {
        try {
            return typeof arg === 'string' ? arg : JSON.stringify(arg);
        } catch {
            return String(arg);
        }
    }).join(' ');
    for (const text of isBlacklist) {
        if (fullMsg.includes(text)) return true;
    }
    return false;
};

console.log = (...args) => {
    if (filterLogs(args)) return;
    originalLog.apply(console, args);
};

console.info = (...args) => {
    if (filterLogs(args)) return;
    originalInfo.apply(console, args);
};

console.debug = (...args) => {
    if (filterLogs(args)) return;
    originalDebug.apply(console, args);
};