import { execFileSync } from 'node:child_process'

/*
 * checks only what the commit touches: eslint on staged files, `inu check` on plugin changes,
 * the scripts typecheck on node-side changes. eslint reads the working tree, so partially staged
 * files include unstaged edits; ci `pnpm lint` is authoritative
 */

if (process.env.SKIP_PRE_COMMIT) process.exit(0)

const LINTABLE = /\.(?:[cm]?[jt]s|json|md)$/

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)

const touches = (...prefixes: string[]) => staged.some(file => prefixes.some(prefix => file.startsWith(prefix)))

const steps: Array<[string, string[]]> = []

const lintable = staged.filter(file => LINTABLE.test(file))
if (lintable.length > 0) steps.push(['eslint', ['--no-warn-ignored', ...lintable]])
if (touches('src/', 'inu.config.ts', 'tsconfig.json')) steps.push(['inu', ['check']])
if (touches('scripts/', 'eslint.config.ts')) steps.push(['tsc', ['-p', 'scripts']])

for (const [cmd, args] of steps) {
  try {
    execFileSync('pnpm', ['exec', cmd, ...args], { stdio: 'inherit' })
  } catch {
    console.error(`\npre-commit: \`${cmd} ${args.join(' ')}\` failed (--no-verify to skip)`)
    process.exit(1)
  }
}
