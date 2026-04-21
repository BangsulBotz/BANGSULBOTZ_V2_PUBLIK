import chalk from 'chalk';

global.groupStore = global.groupStore || new Map();
const lastRefreshTime = new Map();
const isFetching = new Map(); 

export function getGroupMetadata(jid) {
  return global.groupStore.get(jid) || null;
}

export function hasGroupMetadata(jid) {
  return global.groupStore.has(jid);
}


export async function fetchMetadataWithLock(jid, fetchFn) {
  if (isFetching.get(jid)) return null;
  
  isFetching.set(jid, true);
  try {
    const metadata = await fetchFn(jid);
    return metadata;
  } catch (e) {
    console.error(chalk.red('[ERROR FETCH]'), e.message);
    return null;
  } finally {
    isFetching.delete(jid);
  }
}

export function updateGroupParticipants(jid, update) {
  const now = Date.now();
  const last = lastRefreshTime.get(jid) || 0;

  if (now - last < 500) {
    return true;
  }
  lastRefreshTime.set(jid, now);

  const metadata = getGroupMetadata(jid);
  if (!metadata || !Array.isArray(metadata.participants)) {
    return false;
  }

  let updatedParticipants = [...metadata.participants];
  let changesMade = 0;

  const { participants: changed, action } = update;
  for (const ch of changed) {
    const key = ch.phoneNumber || ch.id;
    if (!key) continue;

    const index = updatedParticipants.findIndex(p =>
      (p.phoneNumber && p.phoneNumber === key) || (p.id && p.id === key)
    );

    if (index !== -1) {
      if (action === 'promote' || action === 'demote') {
        const newAdmin = action === 'promote' ? 'admin' : null;
        if (updatedParticipants[index].admin !== newAdmin) {
          updatedParticipants[index].admin = newAdmin;
          changesMade++;
        }
      } else if (action === 'remove') {
        updatedParticipants.splice(index, 1);
        changesMade++;
      }
    } else if (action === 'add') {
      updatedParticipants.push({ id: ch.id, phoneNumber: ch.phoneNumber, admin: null });
      changesMade++;
    }
  }

  if (changesMade === 0 && action !== 'add') {
    return true;
  }

  const newMeta = {
    ...metadata,
    participants: updatedParticipants,
    participantsCount: updatedParticipants.length,
    lastUpdated: now,
    lastParticipantAction: { action, changesMade, timestamp: now }
  };

  global.groupStore.set(jid, newMeta);
  console.log(chalk.bgCyan.black('PARTICIPANT CACHE UPDATED'), jid);

  return true;
}

export function setGroupMetadata(jid, metadata, options = {}) {
  const now = Date.now();
  const last = lastRefreshTime.get(jid) || 0;

  const isForce = options.force === true;
  const isFromEvent = options.fromParticipant === true;

  // 1. HARD DEBOUNCE: Jika kurang dari 2 detik (kecuali force), abaikan total.
  if (!isForce && now - last < 2000) {
    return;
  }

  const existing = getGroupMetadata(jid);

  // 2. CEK PERUBAHAN: Jika tidak ada perubahan nyata, jangan lakukan apa-apa (Silent)
  if (existing && !isForce) {
    const hasMajorChange =
      existing.subject !== metadata.subject ||
      existing.participants?.length !== metadata.participants?.length ||
      existing.ephemeralDuration !== metadata.ephemeralDuration ||
      existing.desc !== metadata.desc ||
      existing.announce !== metadata.announce ||
      (existing.participants?.filter(p => p.admin)?.length !==
        metadata.participants?.filter(p => p.admin)?.length);

    if (!hasMajorChange) {
      // Hanya update timestamp internal tanpa log berisik
      global.groupStore.set(jid, { ...existing, lastUpdated: now });
      return;
    }
  }

  lastRefreshTime.set(jid, now);

  const enhanced = {
    ...metadata,
    ephemeralExpiration: metadata?.ephemeralDuration ?? null,
    lastUpdated: now,
    lastSubject: metadata.subject || null,
    participantsCount: metadata.participants?.length || 0,
  };

  global.groupStore.set(jid, enhanced);

  console.log(chalk.bgGreen.black('GROUP METADATA FULL UPDATED'));
  console.log(chalk.green('JID:'), chalk.white(jid));
  console.log(chalk.green('Nama:'), chalk.white(metadata.subject || 'N/A'));
  console.log(chalk.green('Member:'), chalk.white(metadata.participants?.length || 'N/A'));
  console.log(chalk.gray('────────────────────────────────────────────────────'));
}

export function debugGroupStore() {
  console.log(chalk.bgMagenta.black('GROUP STORE DEBUG'));
  console.log('Total grup:', global.groupStore.size);
  for (const [jid, meta] of global.groupStore) {
    console.log(`${jid} | ${meta.subject} | ${meta.participants?.length} member`);
  }
}