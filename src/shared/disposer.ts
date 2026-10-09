export function combineDisposers(...disposers: Disposer[]): Disposer {
  const disposer = () => disposers.forEach(d => d())
  disposer[Symbol.dispose] = disposer
  return disposer
}
