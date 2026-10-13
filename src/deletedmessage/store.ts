/*
 * Deleted-message bookkeeping.
 *
 * `updateDeleteMessages` carries only ids, and the app removes the bubble as soon as it applies
 * the update, so the ids are remembered in js and in a java HashSet the marking routine reads on
 * the app thread. Channel deletions name their channel, common-box ones do not; message ids are
 * unique per account, so the common box is tracked under `0`.
 */

import { writeCacheFile } from '../shared/cache-file.js'

const deleted = new Map<string, DeletedRecord>()
const CACHE_FILE = 'deleted-cache.json'
const TTL = 7 * 24 * 60 * 60 * 1000
let javaKeys: JavaObject | null = null
let loaded = false
let saveTimer: number | null = null

interface DeletedRecord { accountId: number, dialogId: number, id: number, expires: number }

const keyOf = (accountId: number, dialogId: number, id: number): string => `${accountId}:${dialogId}:${id}`

function persistDeleted(): void {
  saveTimer = null
  const now = Date.now()
  const records: DeletedRecord[] = []
  for (const record of deleted.values()) {
    if (record.expires > now) records.push(record)
  }
  try {
    writeCacheFile(CACHE_FILE, records)
  } catch (error) {
    console.warn('deletedmessage: cache write failed', error)
  }
}

function scheduleSave(): void {
  if (saveTimer === null) saveTimer = setTimeout(persistDeleted, 25)
}

function recordDeletion(accountId: number, dialogId: number, ids: number[]): void {
  const now = Date.now()
  for (const id of ids) {
    const key = keyOf(accountId, dialogId, id)
    const record = deleted.get(key)
    if (record === undefined || record.expires <= now) deleted.set(key, { accountId, dialogId, id, expires: now + TTL })
    try { javaKeys?.call('add', key) } catch {}
  }
  scheduleSave()
}

function loadDeleted(): void {
  if (loaded) return
  loaded = true
  if (!inu.fs.exists(CACHE_FILE)) return
  try {
    const records = JSON.parse(new TextDecoder().decode(inu.fs.read(CACHE_FILE))) as DeletedRecord[]
    const now = Date.now()
    for (const record of records) {
      if (typeof record.accountId !== 'number') continue
      if (record.expires > now) deleted.set(keyOf(record.accountId, record.dialogId, record.id), record)
    }
    if (records.length !== deleted.size) scheduleSave()
  } catch {
    try { inu.fs.rm(CACHE_FILE) } catch {}
  }
}

function keySet(): JavaObject | null {
  if (javaKeys !== null) return javaKeys
  try {
    // SAFETY: unsafe.jvm: the marking routine runs on the app thread and can't call into js, so the
    // recorded keys live in a java HashSet it can read directly
    javaKeys = new (inu.jvm.cls('java.util.HashSet'))()
    for (const key of deleted.keys()) javaKeys.call('add', key)
    return javaKeys
  } catch {
    return null
  }
}

/** The recorded keys as a java HashSet the marking routine can capture; `null` when jvm is unavailable. */
export function deletedKeySet(): JavaObject | null {
  loadDeleted()
  return keySet()
}

export function recordChannelDeletion(accountId: number, channelId: number, ids: number[]): void {
  recordDeletion(accountId, -channelId, ids)
  recordDeletion(accountId, channelId, ids)
}

export function recordCommonBoxDeletion(accountId: number, ids: number[]): void {
  recordDeletion(accountId, 0, ids)
}

inu.onUnload(() => {
  if (saveTimer === null) return
  clearTimeout(saveTimer)
  persistDeleted()
})
