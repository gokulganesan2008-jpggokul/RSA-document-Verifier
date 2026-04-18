// db/idb.js — IndexedDB data layer
const DB_NAME = 'rsa-verifier-db'
const DB_VERSION = 1
let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db) }
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('users')) {
        const u = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true })
        u.createIndex('username', 'username', { unique: true })
      }
      if (!db.objectStoreNames.contains('userKeys')) {
        db.createObjectStore('userKeys', { keyPath: 'userId' })
      }
      if (!db.objectStoreNames.contains('fileRegistry')) {
        const f = db.createObjectStore('fileRegistry', { keyPath: 'id', autoIncrement: true })
        f.createIndex('userId', 'userId')
        f.createIndex('verificationId', 'verificationId', { unique: true })
        f.createIndex('hashHex', 'hashHex')
      }
      if (!db.objectStoreNames.contains('auditLogs')) {
        const a = db.createObjectStore('auditLogs', { keyPath: 'id', autoIncrement: true })
        a.createIndex('userId', 'userId')
        a.createIndex('timestamp', 'timestamp')
      }
    }
  })
}

function p(req) {
  return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error) })
}

function store(db, name, mode = 'readonly') {
  return db.transaction(name, mode).objectStore(name)
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function dbCreateUser(username, passwordHash) {
  const db = await openDB()
  return p(store(db, 'users', 'readwrite').add({ username, passwordHash, createdAt: Date.now() }))
}

export async function dbGetUserByUsername(username) {
  const db = await openDB()
  return p(store(db, 'users').index('username').get(username))
}

export async function dbGetUserById(id) {
  const db = await openDB()
  return p(store(db, 'users').get(id))
}

// ─── USER KEYS ────────────────────────────────────────────────────────────────
export async function dbSaveUserKeys(userId, publicKeyPEM, privateKeyPEM) {
  const db = await openDB()
  return p(store(db, 'userKeys', 'readwrite').put({ userId, publicKeyPEM, privateKeyPEM, createdAt: Date.now() }))
}

export async function dbGetUserKeys(userId) {
  const db = await openDB()
  return p(store(db, 'userKeys').get(userId))
}

// ─── FILE REGISTRY ────────────────────────────────────────────────────────────
export async function dbAddFileRecord(record) {
  const db = await openDB()
  return p(store(db, 'fileRegistry', 'readwrite').add(record))
}

export async function dbGetFileByVerificationId(verificationId) {
  const db = await openDB()
  return p(store(db, 'fileRegistry').index('verificationId').get(verificationId))
}

export async function dbGetFilesByHash(hashHex) {
  const db = await openDB()
  return p(store(db, 'fileRegistry').index('hashHex').getAll(hashHex))
}

export async function dbGetUserFiles(userId) {
  const db = await openDB()
  const all = await p(store(db, 'fileRegistry').index('userId').getAll(userId))
  return all.sort((a, b) => b.signedAt - a.signedAt)
}

export async function dbGetAllFiles() {
  const db = await openDB()
  const all = await p(store(db, 'fileRegistry').getAll())
  return all.sort((a, b) => b.signedAt - a.signedAt)
}

export async function dbDeleteFileRecord(id) {
  const db = await openDB()
  return p(store(db, 'fileRegistry', 'readwrite').delete(id))
}

// ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
export async function dbAddAuditLog(log) {
  const db = await openDB()
  return p(store(db, 'auditLogs', 'readwrite').add({ ...log, timestamp: Date.now() }))
}

export async function dbGetUserAuditLogs(userId) {
  const db = await openDB()
  const all = await p(store(db, 'auditLogs').index('userId').getAll(userId))
  return all.sort((a, b) => b.timestamp - a.timestamp)
}

export async function dbGetAllAuditLogs() {
  const db = await openDB()
  const all = await p(store(db, 'auditLogs').getAll())
  return all.sort((a, b) => b.timestamp - a.timestamp)
}

// ─── STATS ────────────────────────────────────────────────────────────────────
export async function dbGetUserStats(userId) {
  const db = await openDB()
  const [files, logs] = await Promise.all([
    p(store(db, 'fileRegistry').index('userId').getAll(userId)),
    p(store(db, 'auditLogs').index('userId').getAll(userId)),
  ])
  return {
    totalSigned: files.length,
    totalVerified: logs.filter(l => l.action === 'verify').length,
    recentFiles: files.sort((a, b) => b.signedAt - a.signedAt).slice(0, 6),
    recentLogs: logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8),
  }
}
