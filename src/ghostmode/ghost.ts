import { combineDisposers } from '../shared/disposer.js'

/**
 * Ghost read and ghost story.
 *
 * Reading a chat is reported with an RPC (`messages.readHistory`, `channels.readHistory`, and the
 * encrypted/discussion/saved variants); the other side only learns the "read" mark from that call.
 * Stories work the same way: `stories.incrementStoryViews` is what tells the owner you looked.
 *
 * Those calls are answered locally and never forwarded, so the marks never reach the server. The
 * app has already updated its own unread state before sending, so nothing changes locally. The
 * trade-off is that the server keeps its copy, so unread badges and story rings can come back
 * after a restart.
 *
 * The read RPCs return `messages.affectedMessages`, which the app feeds into its update state. The
 * account's current `pts` is echoed, so the response applies as a no-op instead of forcing a
 * difference fetch.
 */

const MESSAGES_AFFECTED = 'messages.affectedMessages'
const MESSAGES_STORAGE = 'org.telegram.messenger.MessagesStorage'

/** The account's last update `pts`, or `null` when it cannot be read. */
function lastPts(accountId: number): number | null {
  // SAFETY: unsafe.jvm: no public api exposes the account's update pts; echoing it keeps the read reply a no-op
  try {
    const storage = inu.jvm.cls(MESSAGES_STORAGE).callStatic('getInstance', accountId)
    const pts = Number(storage.call('getLastPtsValue'))
    return pts > 0 ? pts : null
  } catch {
    return null
  }
}

/** Empty `messages.affectedMessages` that leaves the app's update state untouched. */
function affected(context: { account: inu.Account }): tl.messages.RawAffectedMessages | null {
  const pts = lastPts(context.account.id)
  if (pts === null) return null
  return { _: MESSAGES_AFFECTED, pts, pts_count: 0 }
}

export function installGhostRead(): Disposer {
  return combineDisposers(
    inu.interceptRpc('messages.readHistory', (context, next) => affected(context) ?? next()),
    inu.interceptRpc('messages.readMessageContents', (context, next) => affected(context) ?? next()),
    inu.interceptRpc('channels.readHistory', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('channels.readMessageContents', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('messages.readEncryptedHistory', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('messages.readDiscussion', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('messages.readSavedHistory', () => ({ _: 'boolTrue' })),
  )
}

export function installGhostStory(): Disposer {
  return combineDisposers(
    inu.interceptRpc('stories.incrementStoryViews', () => ({ _: 'boolTrue' })),
  )
}