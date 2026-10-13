import { deletedKeySet } from './store.js'

/*
 * Dims bubbles of kept deleted messages. `onDraw` runs every frame for every cell, so the check is
 * a compiled routine reading a HashSet captured at install. It resets alpha from the cell's message
 * on each draw, so recycled cells don't leak it; the toggle flips a captured AtomicBoolean.
 */

const CELL_CLASS = 'org.telegram.ui.Cells.ChatMessageCell'
const ATOMIC_BOOLEAN = 'java.util.concurrent.atomic.AtomicBoolean'

let marking: JavaObject | null = null

/** Turn the in-chat dimming on or off; a no-op until {@link installDeletedMarking} succeeded. */
export function setDeletedMarking(enabled: boolean): void {
  if (marking !== null) marking.call('set', enabled)
}

export function installDeletedMarking(initiallyOn: boolean): void {
  let cells: JavaClass
  let keys: JavaObject | null
  let atomic: JavaObject

  try {
    cells = inu.jvm.cls(CELL_CLASS)
    keys = deletedKeySet()
    if (keys === null) throw new Error('deleted key set unavailable')
    // SAFETY: unsafe.jvm: the gate is read from inside a compiled routine, which only sees java values
    atomic = new (inu.jvm.cls(ATOMIC_BOOLEAN))(initiallyOn)
  } catch (error) {
    console.warn('deletedmessage: in-chat marking unavailable', error)
    return
  }

  marking = atomic
  // the routine body is a java subset without types, so the captured handles are widened to match
  const ON: any = atomic
  const KEYS: any = keys

  // SAFETY: unsafe.jvm + unsafe.xposed: binding and drawing cells happen in app ui code, no plugin api can mark a kept bubble
  const dim = inu.xposed.routine((ctx) => {
    const cell = ctx.thisObject
    const object = cell.getMessageObject()
    if (object === null) return
    const id = object.getId()
    const key = `${object.getDialogId()}:${id}`
    const fallback = `0:${id}`
    let alpha = 1.0
    if (ON.get() && (KEYS.contains(key) || KEYS.contains(fallback))) alpha = 0.5
    cell.setAlpha(alpha)
  })

  try {
    inu.xposed.hookAllOverloads(cells, 'setMessageObject', { after: dim })
    inu.xposed.hookAllOverloads(cells, 'onDraw', { before: dim })
  } catch (error) {
    console.warn('deletedmessage: marking hooks failed', error)
  }
}
