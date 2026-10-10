import { blockScreenshotNotifications, FLAG_SECURE, tryHooks } from '../shared/hooks.js'
import { Toggle } from '../shared/toggle.js'

/*
 * SecretMediaViewer sets FLAG_SECURE in its overlay LayoutParams, SecretVoicePlayer (a Dialog) in
 * Window.setAttributes. the viewer's root view is an anonymous class matched by View.toString,
 * since a Class value in a routine is treated as a static receiver. a dialog window reports the
 * dialog as its callback
 */
const screenshots = new Toggle({
  key: 'screenshots',
  default: true,
  text: 'allow screenshots of one-time media',
  subtitle: 'photos, videos, voice and video messages',
  register: () => {
    // SAFETY: unsafe.xposed: FLAG_SECURE is set by app code on framework windows, no plugin api covers it
    const LayoutParams: any = inu.jvm.cls('android.view.WindowManager$LayoutParams')
    const SecretVoicePlayer: any = inu.jvm.cls('org.telegram.ui.SecretVoicePlayer')
    const VIEWER_PREFIX = 'org.telegram.ui.SecretMediaViewer$'
    return tryHooks(
      'screenshots',
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.WindowManagerImpl'), 'addView', {
        before: inu.xposed.routine((ctx) => {
          const view = ctx.args[0]
          const params = ctx.args[1]
          if (view !== null && params instanceof LayoutParams && view.toString().startsWith(VIEWER_PREFIX)) {
            params.flags = params.flags & ~FLAG_SECURE
          }
        }),
      }),
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('android.view.Window'), 'setAttributes', {
        before: inu.xposed.routine((ctx) => {
          const params = ctx.args[0]
          if (params !== null && ctx.thisObject.getCallback() instanceof SecretVoicePlayer) {
            params.flags = params.flags & ~FLAG_SECURE
          }
        }),
      }),
    )
  },
})

/*
 * needDrawBluredPreview/isVoiceOnce/isRoundOnce hide "save to gallery", but also drive the blur
 * and the viewer choice, so they answer false only inside createMenu, scoped by a ThreadLocal.
 * photos are already on disk (the bubble blurs the full size), videos must be loaded first
 */
const save = new Toggle({
  key: 'save',
  default: true,
  text: 'allow saving one-time media',
  subtitle: '"save to gallery" in the message menu, before opening it',
  register: () => {
    // SAFETY: unsafe.xposed: the save option is gated inside ChatActivity menu code, no plugin api exposes it
    const ThreadLocal = inu.jvm.cls('java.lang.ThreadLocal')
    const inMenu: any = new ThreadLocal()
    const MessageObject = inu.jvm.cls('org.telegram.messenger.MessageObject')
    const unlockCheck = (name: string) => () => inu.xposed.hookAllOverloads(MessageObject, name, {
      after: inu.xposed.routine((ctx) => {
        if (inMenu.get() === true) ctx.setReturnValue(false)
      }),
    })
    return tryHooks(
      'save',
      () => inu.xposed.hookAllOverloads(inu.jvm.cls('org.telegram.ui.ChatActivity'), 'createMenu', {
        before: inu.xposed.routine(() => {
          inMenu.set(true)
        }),
        after: inu.xposed.routine(() => {
          inMenu.remove()
        }),
      }),
      unlockCheck('needDrawBluredPreview'),
      unlockCheck('isVoiceOnce'),
      unlockCheck('isRoundOnce'),
    )
  },
})

const screenshotNotify = new Toggle({
  key: 'screenshot_notify',
  default: true,
  text: 'don\'t report screenshots',
  subtitle: 'the sender won\'t see "took a screenshot"',
  register: blockScreenshotNotifications,
})

const toggles = [screenshots, save, screenshotNotify]
for (const toggle of toggles) toggle.init()

inu.registerSettings(inu.ui.settingsPage({
  title: 'one-time allower',
  items: () => toggles.map(toggle => toggle.check()),
}))
