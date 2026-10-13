export function writeCacheFile(path: string, value: unknown): void {
  const staged = `${path}.tmp`
  inu.fs.write(staged, new TextEncoder().encode(JSON.stringify(value)))
  inu.fs.move(staged, path)
}
