import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

/*
 * one build number for every plugin: the highest `v<N>` tag plus one, so releasing needs no repo
 * variable or extra token. it reaches each manifest version through TOSBREAKER_BUILD, and
 * `changelogs/<N>.md` becomes the release notes when it exists
 */

const TAG = /^v(\d+)$/

const tags = execFileSync('git', ['tag', '-l', 'v*'], { encoding: 'utf8' }).split('\n')
const builds = tags.map(tag => TAG.exec(tag)?.[1]).filter(Boolean).map(Number)
const previous = builds.length > 0 ? Math.max(...builds) : 0

const buildNum = previous + 1
const out = {
  'build-num': String(buildNum),
  'tag': `v${buildNum}`,
  'previous-tag': previous > 0 ? `v${previous}` : '',
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${Object.entries(out).map(([k, v]) => `${k}=${v}`).join('\n')}\n`)
}
console.log(JSON.stringify(out, null, 2))
