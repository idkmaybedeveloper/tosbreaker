import { combineDisposers } from './disposer.js'

export const FLAG_SECURE = 0x2000

/*
 * hooking throws `unsupported` on some devices, and r8 may inline a target away in some build.
 * one missing hook is logged instead of failing the whole toggle
 */
export function tryHooks(label: string, ...registers: (() => Disposer)[]): Disposer {
  const disposers: Disposer[] = []
  for (const register of registers) {
    try {
      disposers.push(register())
    } catch (e) {
      console.warn(`${label}: hook failed`, e)
    }
  }
  return combineDisposers(...disposers)
}

/*
 * checkScreenshots is the one place a detected screenshot turns into sendScreenshotNotification
 * or the encrypted ScreenshotMessages action. skipping it also skips the local service message,
 * which intercepting the rpc alone would leave behind
 */
export function blockScreenshotNotifications(): Disposer {
  // SAFETY: unsafe.xposed: secret chats send this through an encrypted service message, interceptRpc can't reach it
  return tryHooks('screenshot notifications', () => {
    const MediaController = inu.jvm.cls('org.telegram.messenger.MediaController')
    return inu.xposed.hookAllOverloads(MediaController, 'checkScreenshots', {
      before: inu.xposed.routine((ctx) => {
        ctx.setReturnValue(null)
      }),
    })
  })
}
