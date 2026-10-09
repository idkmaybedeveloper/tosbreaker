import { combineDisposers } from '../shared/disposer.js'
import { Toggle } from '../shared/toggle.js'

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

const toggles = [noReadStatus, noTypingStatus]
for (const toggle of toggles) toggle.init()

inu.registerSettings(inu.ui.settingsPage({
  title: 'don\'t send statuses',
  items: () => toggles.map(toggle => toggle.check()),
}))
