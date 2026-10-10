import { blockScreenshotNotifications, FLAG_SECURE, tryHooks } from '../shared/hooks.js'
import { Toggle } from '../shared/toggle.js'

/*
 * FLAG_SECURE arrives three ways: Window.setFlags (FlagSecureReason, stories), Window.setAttributes
 * (dialogs, passcode), and raw LayoutParams in addView/updateViewLayout (PhotoViewer,
 * SecretMediaViewer, StoryViewer). every app WindowManager is a WindowManagerImpl
 */
const screenshots = new Toggle({
  key: 'screenshots',
  default: true,
  text: 'allow screenshots everywhere',
  subtitle: 'protected chats, secret chats, one-time media, stories, passcode screen',
  register: () => {
    // SAFETY: unsafe.xposed: FLAG_SECURE is set by app code on framework windows, no plugin api covers it
    const LayoutParams: any = inu.jvm.cls('android.view.WindowManager$LayoutParams')
    return tryHooks(
      'screenshots',
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.Window'), 'setFlags', {
        before: inu.xposed.routine((ctx) => {
          ctx.args[0] = ctx.args[0] & ~FLAG_SECURE
        }),
      }),
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.Window'), 'setAttributes', {
        before: inu.xposed.routine((ctx) => {
          const params = ctx.args[0]
          if (params !== null) params.flags = params.flags & ~FLAG_SECURE
        }),
      }),
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.WindowManagerImpl'), 'addView', {
        before: inu.xposed.routine((ctx) => {
          const params = ctx.args[1]
          if (params instanceof LayoutParams) params.flags = params.flags & ~FLAG_SECURE
        }),
      }),
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.WindowManagerImpl'), 'updateViewLayout', {
        before: inu.xposed.routine((ctx) => {
          const params = ctx.args[1]
          if (params instanceof LayoutParams) params.flags = params.flags & ~FLAG_SECURE
        }),
      }),
    )
  },
})

/*
 * chat and userFull noforwards are only read through MessagesController; message.noforwards is a
 * plain field, cleared once a MessageObject wraps it. the server still refuses forwarding, this
 * unlocks only client-side copy, save and share
 */
const noforwards = new Toggle({
  key: 'noforwards',
  default: true,
  text: 'ignore content protection',
  subtitle: 'copy and save media in chats that restrict saving content',
  register: () => {
    // SAFETY: unsafe.xposed: noforwards is enforced in app ui code; stripping it via interceptUpdate/interceptRpc would mean rewriting every method returning chats or messages
    const MessagesController = inu.jvm.cls('org.telegram.messenger.MessagesController')
    return tryHooks(
      'noforwards',
      () => inu.xposed.hookAllOverloads(MessagesController, 'isChatNoForwards', {
        before: inu.xposed.routine((ctx) => {
          ctx.setReturnValue(false)
        }),
      }),
      () => inu.xposed.hookAllOverloads(MessagesController, 'isUserNoForwards', {
        before: inu.xposed.routine((ctx) => {
          ctx.setReturnValue(false)
        }),
      }),
      () => inu.xposed.hookAllConstructors(inu.jvm.cls('org.telegram.messenger.MessageObject'), {
        after: inu.xposed.routine((ctx) => {
          const owner = ctx.thisObject.messageOwner
          if (owner !== null && owner.noforwards) owner.noforwards = false
        }),
      }),
    )
  },
})

const screenshotNotify = new Toggle({
  key: 'screenshot_notify',
  default: true,
  text: 'don\'t report screenshots',
  subtitle: 'the other side won\'t see "took a screenshot"',
  register: blockScreenshotNotifications,
})

const toggles = [screenshots, noforwards, screenshotNotify]
for (const toggle of toggles) toggle.init()

inu.registerSettings(inu.ui.settingsPage({
  title: 'screen allower',
  items: () => [
    ...toggles.map(toggle => toggle.check()),
    inu.ui.separator('already open screens and chats pick changes up after reopening.'),
  ],
}))
