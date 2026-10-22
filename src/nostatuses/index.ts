import { combineDisposers } from '../shared/disposer.js'
import { Toggle } from '../shared/toggle.js'

function sendStatus(offline: boolean): void {
  inu
    .invokeRpc({ _: 'account.updateStatus', offline })
    .catch(e => console.error('nostatuses: account.updateStatus failed', e))
}

function registerOnlineHider(): Disposer {
  // do NOT make this per account, inactive accounts are already offline
  let timer: number | undefined
  let disposed = false

  sendStatus(true)
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
    ], async (_ctx, next) => {
      const res = await next()
      if (disposed) return res

      clearTimeout(timer)
      timer = setTimeout(() => {
        clearTimeout(timer)
        sendStatus(true)
      }, 1000 /* offline after send ms */)
      return res
    }),
    () => {
      disposed = true
      clearTimeout(timer)
      sendStatus(false)
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
    // forum topics and comment threads
    inu.interceptRpc('messages.readDiscussion', () => ({ _: 'boolTrue' })),
    // channel direct messages
    inu.interceptRpc('messages.readSavedHistory', () => ({ _: 'boolTrue' })),
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

// telegram doesn't have a built-in non-crossed eye icon
const EYE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12,3.67C17.67,3.67 22.67,8.8 22.67,12C22.67,15.2 17.67,20.33 12,20.33C6.33,20.33 1.33,15.2 1.33,12C1.33,8.8 6.33,3.67 12,3.67ZM12,5.33C7.23,5.33 3,9.43 3,12C3,14.57 7.23,18.67 12,18.67C16.77,18.67 21,14.57 21,12C21,9.43 16.77,5.33 12,5.33ZM12,7.67C14.39,7.67 16.33,9.61 16.33,12C16.33,14.39 14.39,16.33 12,16.33C9.61,16.33 7.67,14.39 7.67,12C7.67,9.61 9.61,7.67 12,7.67ZM12,9.33C10.53,9.33 9.33,10.53 9.33,12C9.33,13.47 10.53,14.67 12,14.67C13.47,14.67 14.67,13.47 14.67,12C14.67,10.53 13.47,9.33 12,9.33Z"/></svg>'

const ghostModeAction = new Toggle({
  key: 'ghost_mode_action',
  default: true,
  text: 'ghost mode shortcut',
  subtitle: 'toggle ghost mode from the main menu',
  register: () => inu.registerGlobalAction({
    id: 'toggle-ghost-mode',
    text: () => noOnlineStatus.enabled ? 'disable ghost mode' : 'enable ghost mode',
    icon: () => noOnlineStatus.enabled ? inu.icons.svg(EYE_ICON) : inu.icons.common('eyeOff'),
    callback: () => {
      noOnlineStatus.enabled = !noOnlineStatus.enabled
    },
  }),
})

function markRead(ctx: inu.MessageActionContext): void {
  const maxId = Math.max(...ctx.messages.map(message => message.id))
  ctx.account
    .readHistory(ctx.dialogId, { maxId, topicId: ctx.topicId })
    .catch((e) => {
      console.error('nostatuses: mark as read failed', e)
      inu.ui.toast('couldn\'t mark as read')
    })
}

const markReadAction = new Toggle({
  key: 'mark_read_action',
  default: true,
  text: '"mark as read" in message menu',
  subtitle: 'shown when "hide read receipts" is enabled',
  register: () => inu.registerMessageAction({
    id: 'mark-read',
    text: 'mark as read',
    icon: inu.icons.common('check'),
    visible: ctx => noReadStatus.active && ctx.messages.length > 0,
    callback: markRead,
  }),
})

const toggles = [noOnlineStatus, ...forcedToggles, ghostModeAction, markReadAction]
for (const toggle of toggles) toggle.init()

const page = inu.ui.settingsPage({
  title: 'don\'t send statuses',
  items: () => toggles.map(toggle => toggle.check(() => page.invalidate())),
})
inu.registerSettings(page)
