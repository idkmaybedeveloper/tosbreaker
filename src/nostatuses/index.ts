import { combineDisposers } from '../shared/disposer.js'
import { Toggle } from '../shared/toggle.js'

function sendStatus(account: inu.Account, offline: boolean): void {
  account
    .invokeRpc({ _: 'account.updateStatus', offline })
    .catch(e => console.error('nostatuses: account.updateStatus failed', e))
}

function registerOnlineHider(): Disposer {
  const timers = new Map<number, number>()
  let disposed = false

  inu.accounts().forEach(account => sendStatus(account, true))
  return combineDisposers(
    inu.interceptRpc('account.updateStatus', (ctx, next) => ctx.request.offline ? next() : { _: 'boolTrue' }),

    inu.interceptRpc([
      'messages.sendMessage',
      'messages.sendMedia',
      'messages.sendMultiMedia',
      'messages.forwardMessages',
      'messages.sendInlineBotResult',
      'messages.sendReaction',
      'messages.editMessage',
      'messages.sendVote',
      'stories.sendStory',
    ], async (ctx, next) => {
      const res = await next()
      if (disposed) return res

      const { account } = ctx
      clearTimeout(timers.get(account.id))
      timers.set(account.id, setTimeout(() => {
        timers.delete(account.id)
        sendStatus(account, true)
      }, 1000 /* offline after send ms */))
      return res
    }),
    () => {
      disposed = true
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
      inu.accounts().forEach(account => sendStatus(account, false))
    },
  )
}

const noReadStatus = new Toggle({
  key: 'no_read_status',
  default: false,
  text: 'hide read receipts',
  subtitle: 'disable sending read status for messages',
  register: () => combineDisposers(
    inu.interceptRpc('messages.readHistory', () => ({ _: 'messages.affectedMessages', pts: 0, pts_count: 0 })),
    inu.interceptRpc('messages.readMessageContents', () => ({ _: 'messages.affectedMessages', pts: 0, pts_count: 0 })),
    inu.interceptRpc('channels.readHistory', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('channels.readMessageContents', () => ({ _: 'boolTrue' })),
  ),
})

const noTypingStatus = new Toggle({
  key: 'no_typing_status',
  default: false,
  text: 'hide typing status',
  subtitle: 'disable sending typing status for PMs',
  register: () => combineDisposers(
    inu.interceptRpc('messages.setTyping', () => ({ _: 'boolTrue' })),
    inu.interceptRpc('messages.setEncryptedTyping', () => ({ _: 'boolTrue' })),
  ),
})

// reading or typing would give away that you're online, so this one forces the others on
const forcedToggles = [noReadStatus, noTypingStatus]

const noOnlineStatus = new Toggle({
  key: 'no_online_status',
  default: false,
  text: 'hide online status',
  subtitle: 'aka ghost mode',
  register: () => {
    forcedToggles.forEach(toggle => toggle.force('hide online status'))
    const hider = registerOnlineHider()
    return combineDisposers(hider, () => forcedToggles.forEach(toggle => toggle.force(null)))
  },
  onChange: () => page.invalidate(),
})

const toggles = [noOnlineStatus, ...forcedToggles]
for (const toggle of toggles) toggle.init()

const page = inu.ui.settingsPage({
  title: 'don\'t send statuses',
  items: () => toggles.map(toggle => toggle.check(() => page.invalidate())),
})
inu.registerSettings(page)
