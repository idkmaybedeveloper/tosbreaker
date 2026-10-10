export function combineDisposers(...disposers: Array<() => void>): Disposer {
  const disposer = () => disposers.forEach(d => d())
  disposer[Symbol.dispose] = disposer
  return disposer
}
