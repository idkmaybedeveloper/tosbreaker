import { combineDisposers } from '../shared/disposer.js'

/**
 * Ghost presence - hide typing, recording, and upload indicators from others.
 *
 * Every "someone is typing / recording / uploading" bubble other people see comes from
 * `messages.setTyping` with a `sendMessage*Action` payload. Those calls are answered locally and
 * never forwarded, so the server never learns about the activity; both methods return `Bool`, so
 * an echoed `boolTrue` is a valid no-op response. `messages.setEncryptedTyping` carries the same
 * indicator for secret chats and is hidden the same way.
 *
 * The cancel action only clears an indicator the other side cannot have seen (the ones before it
 * were never sent), so it is forwarded untouched. Note this does not hide the account's own
 * "online" ping - that is not sent through this RPC.
 */

export function installGhostPresence(): Disposer {
  return combineDisposers(
    inu.interceptRpc('messages.setTyping', (context, next) => {
      const action = context.request.action
      if (action === undefined || action._ === 'sendMessageCancelAction') return next()
      return { _: 'boolTrue' }
    }),
    inu.interceptRpc('messages.setEncryptedTyping', () => ({ _: 'boolTrue' })),
  )
}