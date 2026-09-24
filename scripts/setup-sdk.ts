import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { join, resolve } from 'node:path'

/*
 * the inugram sdk isn't on npm yet, so it's built from a sibling inugram checkout
 * (plugins branch). besides the cli itself, @inugram/plugin-types needs android.tl.d.ts and
 * tl-names.txt, which inugram's generate-tl derives from stock telegram sources in worktree/.
 * a full `pnpm run setup` (clone + stgit stack) is heavy, so without a worktree only the
 * tgnet/ and tlscheme/ dirs are sparse-cloned at inugram's upstream-commit, and generate-tl is
 * run from a throwaway root that symlinks everything else back into the inugram checkout.
 * runs on node's own type stripping, so no deps and no erasable-syntax-breaking ts features
 */

const TELEGRAM_REPO = 'https://github.com/DrKLO/Telegram.git'
const TELEGRAM_SPARSE = [
  '/gradle.properties',
  '/TMessagesProj/src/main/java/org/telegram/tgnet/',
  '/TMessagesProj_AppTests/tlscheme/',
]

const root = resolve(import.meta.dirname, '..')
const inugram = resolve(process.env.INUGRAM_DIR ?? join(root, '../inugram'))
const cache = join(root, '.sdk-cache')

function step(message: string): void {
  console.log(`==> ${message}`)
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function run(cwd: string, cmd: string, args: string[]): void {
  execFileSync(cmd, args, { cwd, stdio: 'inherit' })
}

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function fetchTelegram(commit: string): string {
  const dir = join(cache, 'telegram')
  try {
    if (git(dir, ['rev-parse', 'HEAD']) === commit) return dir
  } catch {}

  rmSync(dir, { recursive: true, force: true })
  mkdirSync(cache, { recursive: true })
  run(cache, 'git', ['clone', '-q', '--filter=blob:none', '--no-checkout', '--depth', '1', TELEGRAM_REPO, dir])
  run(dir, 'git', ['sparse-checkout', 'set', '--no-cone', ...TELEGRAM_SPARSE])
  run(dir, 'git', ['fetch', '-q', '--depth', '1', 'origin', commit])
  run(dir, 'git', ['checkout', '-q', 'FETCH_HEAD'])
  return dir
}

function generateTlFromSparse(): void {
  const commit = readFileSync(join(inugram, 'upstream-commit'), 'utf8').trim()
  const telegram = fetchTelegram(commit)

  const fake = join(cache, 'root')
  rmSync(fake, { recursive: true, force: true })
  mkdirSync(fake, { recursive: true })
  cpSync(join(inugram, 'scripts'), join(fake, 'scripts'), { recursive: true })
  cpSync(join(inugram, 'package.json'), join(fake, 'package.json'))
  for (const name of ['sdk', 'src', 'node_modules']) symlinkSync(join(inugram, name), join(fake, name))
  symlinkSync(telegram, join(fake, 'worktree'))
  mkdirSync(join(inugram, 'src/core/src/main/resources'), { recursive: true })

  run(fake, join(inugram, 'node_modules/.bin/tsx'), ['scripts/generate-tl.ts'])
}

if (!existsSync(inugram)) {
  fail(`no inugram checkout at ${inugram}\n`
    + 'clone it next to this repo: git clone -b plugins https://github.com/teidesu/inugram.git ../inugram')
}
if (!existsSync(join(inugram, 'sdk/cli'))) fail(`${inugram} has no sdk/cli, is it on the plugins branch?`)

step(`building cli in ${inugram}`)
run(inugram, 'pnpm', ['install'])
run(inugram, 'pnpm', ['run', 'build-sdk'])

step('generating tl typings')
if (existsSync(join(inugram, 'worktree/TMessagesProj'))) run(inugram, 'pnpm', ['run', 'generate-tl'])
else generateTlFromSparse()

step('installing deps')
run(root, 'pnpm', ['install'])

console.log('done. try: pnpm check && pnpm build')
