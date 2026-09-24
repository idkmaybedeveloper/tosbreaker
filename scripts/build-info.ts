import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [distDir, outFile] = process.argv.slice(2)
if (!distDir || !outFile) {
  console.error('usage: node scripts/build-info.ts <dist dir> <out json>')
  process.exit(1)
}

const SUFFIX = '.inu.js'

const plugins = readdirSync(distDir)
  .filter(file => file.endsWith(SUFFIX))
  .sort()
  .map((file) => {
    const header = readFileSync(join(distDir, file), 'utf8')
    const version = /^\/\/ @version\s+(\S+)/m.exec(header)?.[1]
    if (!version) throw new Error(`no @version in ${file}`)
    const name = file.slice(0, -SUFFIX.length)
    return { name, file, version, tag: `${name}-v${version}` }
  })

if (plugins.length === 0) throw new Error(`no ${SUFFIX} files in ${distDir}`)

const info = {
  plugins,
  commitSha: process.env.GITHUB_SHA ?? null,
  repo: process.env.GITHUB_REPOSITORY ?? null,
  inugramRepo: process.env.INUGRAM_REPO ?? null,
  inugramSha: process.env.INUGRAM_SHA ?? null,
}
writeFileSync(outFile, `${JSON.stringify(info, null, 2)}\n`)

for (const plugin of plugins) console.log(`${plugin.tag}  ${plugin.file}`)
