import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [distDir, outFile] = process.argv.slice(2)
if (!distDir || !outFile) {
  console.error('usage: node scripts/build-info.ts <dist dir> <out json>')
  process.exit(1)
}

const SUFFIX = '.inu.js'

const sdkVersion: string = JSON.parse(readFileSync(new URL('../node_modules/@inugram/cli/package.json', import.meta.url), 'utf8')).version

const plugins = readdirSync(distDir)
  .filter(file => file.endsWith(SUFFIX))
  .sort()
  .map((file) => {
    const header = readFileSync(join(distDir, file), 'utf8')
    const version = /^\/\/ @version\s+(\S+)/m.exec(header)?.[1]
    if (!version) throw new Error(`no @version in ${file}`)
    const name = file.slice(0, -SUFFIX.length)
    return { name, file, version }
  })

if (plugins.length === 0) throw new Error(`no ${SUFFIX} files in ${distDir}`)

const info = {
  build: process.env.TOSBREAKER_BUILD || null,
  plugins,
  commitSha: process.env.GITHUB_SHA ?? null,
  repo: process.env.GITHUB_REPOSITORY ?? null,
  sdk: `@inugram/cli@${sdkVersion}`,
}
writeFileSync(outFile, `${JSON.stringify(info, null, 2)}\n`)

for (const plugin of plugins) console.log(`${plugin.name}@${plugin.version}  ${plugin.file}`)
