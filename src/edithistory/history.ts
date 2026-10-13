/*
 * Edit history - the previous versions of edited messages.
 *
 * The server keeps only the latest version of a message, so every message the plugin sees is
 * snapshotted: `onNewMessage` stores the initial text and `onMessageEdited` promotes the stored
 * snapshot into the history before refreshing it. Versions are persisted in the plugin's private
 * directory and expire after seven days.
 *
 * Formatting-only edits count too - Telegram treats an entity change as an edit - so a snapshot
 * compares both the text and its entities.
 */

import { writeCacheFile } from '../shared/cache-file.js'

interface EditVersion {
  text: TextWithEntities
  date: number
  raw: tl.RawMessage
  expires: number
}

const snapshots = new Map<string, EditVersion>()
const history = new Map<string, EditVersion[]>()

/* At most this many versions are kept per message; the oldest are dropped first. */
const MAX_VERSIONS = 50
const MAX_CACHED_VERSIONS = 2000
const MAX_CACHED_MESSAGES = 500
const CACHE_FILE = 'edit-history.json'
const TTL = 7 * 24 * 60 * 60 * 1000
let cacheLoaded = false
let saveTimer: number | null = null

const keyOf = (accountId: number, id: number): string => `${accountId}:${id}`

function sameText(a: TextWithEntities, b: TextWithEntities): boolean {
  return a.text === b.text && JSON.stringify(a.entities ?? []) === JSON.stringify(b.entities ?? [])
}

function prune(now: number): void {
  for (const [key, version] of snapshots) {
    if (version.expires <= now) snapshots.delete(key)
  }
  for (const [key, versions] of history) {
    const fresh = versions.filter(version => version.expires > now)
    if (fresh.length === 0) history.delete(key)
    else history.set(key, fresh)
  }
  if (snapshots.size > MAX_CACHED_MESSAGES) {
    const excess = snapshots.size - MAX_CACHED_MESSAGES
    const keys = snapshots.keys()
    for (let index = 0; index < excess; index++) {
      const key = keys.next().value
      if (key === undefined) break
      snapshots.delete(key)
    }
  }
}

function persist(): void {
  saveTimer = null
  const payload = {
    snapshots: [...snapshots.entries()],
    history: [...history.entries()].map(([key, versions]) => [key, versions.slice(-MAX_VERSIONS)]),
  }
  try {
    writeCacheFile(CACHE_FILE, payload)
  } catch (error) {
    console.warn('edithistory: cache write failed', error)
  }
}

function scheduleSave(): void {
  if (saveTimer === null) saveTimer = setTimeout(persist, 25)
}

function loadCache(): void {
  if (cacheLoaded) return
  cacheLoaded = true
  if (!inu.fs.exists(CACHE_FILE)) return
  try {
    const payload = JSON.parse(new TextDecoder().decode(inu.fs.read(CACHE_FILE))) as {
      snapshots?: [string, EditVersion][]
      history?: [string, EditVersion[]][]
    }
    for (const [key, version] of payload.snapshots ?? []) snapshots.set(key, version)
    for (const [key, versions] of payload.history ?? []) history.set(key, versions.slice(-MAX_VERSIONS))
    prune(Date.now())
    scheduleSave()
  } catch {
    try { inu.fs.rm(CACHE_FILE) } catch {}
  }
}

/* A text-only message cut down to what the history screen needs to draw an entry. */
function minimalRaw(message: inu.Message): tl.RawMessage | null {
  const source = message.raw
  if (source._ !== 'message' && source._ !== 'messageService') return null
  return {
    _: 'message',
    id: source.id,
    peer_id: source.peer_id,
    from_id: source.from_id,
    date: message.date,
    message: message.textWithEntities.text,
    entities: message.textWithEntities.entities ?? [],
    out: message.out,
  }
}

/** Snapshot the message; when it is an edit, keep the previous version. */
export function trackEdit(message: inu.Message, accountId: number): void {
  const raw = minimalRaw(message)
  if (raw === null) return
  loadCache()
  const now = Date.now()
  prune(now)
  const key = keyOf(accountId, message.id)
  const current: EditVersion = {
    text: message.textWithEntities,
    date: message.editDate ?? message.date,
    raw,
    expires: now + TTL,
  }
  const previous = snapshots.get(key)
  snapshots.set(key, current)
  if (previous === undefined || sameText(previous.text, current.text)) {
    scheduleSave()
    return
  }
  let versions = history.get(key)
  if (versions === undefined) {
    versions = []
    history.set(key, versions)
  }
  versions.push(previous)
  if (versions.length > MAX_VERSIONS) versions.splice(0, versions.length - MAX_VERSIONS)
  let total = 0
  for (const items of history.values()) total += items.length
  if (total > MAX_CACHED_VERSIONS) {
    const oldestKey = history.keys().next().value
    if (oldestKey !== undefined) history.delete(oldestKey)
  }
  scheduleSave()
}

inu.onUnload(() => {
  if (saveTimer === null) return
  clearTimeout(saveTimer)
  persist()
})

/** Open the stored versions as a chat-style history, newest first. */
export function installEditHistory(): Disposer {
  return inu.registerMessageAction({
    id: 'edit-history',
    text: 'Edit History',
    icon: inu.icons.common('edit'),
    visible: (context) => {
      loadCache()
      return context.messages.some(message => history.has(keyOf(context.account.id, message.id)))
    },
    callback: (context) => {
      const entries: inu.ui.ChatHistoryEntry[] = []
      for (const message of context.messages) {
        const versions = history.get(keyOf(context.account.id, message.id))
        if (versions === undefined) continue
        for (let index = 0; index < versions.length; index++) {
          const version = versions[index]
          const raw: tl.RawMessage = {
            ...version.raw,
            message: version.text.text,
            entities: version.text.entities ?? [],
            date: version.date,
          }
          entries.unshift({
            key: `${context.account.id}:${message.id}:edit:${index}`,
            message: raw,
            synthetic: true,
          })
        }
      }
      inu.ui.openChatHistory({
        title: 'Edit History',
        subtitle: `Message ${context.messages[0]?.id ?? ''}`,
        account: context.account.id,
        synthetic: true,
        load: () => ({ entries }),
      })
    },
  })
}
