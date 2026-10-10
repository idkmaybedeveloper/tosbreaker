# `tosbreaker`

tos breaking features in inugram since UHHHH how much?

separate inugram plugins, installed one by one. what's inside: [FEATURES.md](FEATURES.md).

## setup

node >= 24, pnpm, adb for `dev`. then `pnpm install`.

the sdk (`@inugram/cli`, `@inugram/plugin-types`) major is the inugram build it was cut from, bump
both together.

```sh
pnpm check [plugin...]        # manifest, grants, typecheck
pnpm build [plugin...]        # -> dist/<plugin>.inu.js
pnpm dev [plugin...]          # push + hot reload
pnpm dev:release [plugin...]  # same for desu.inugram
pnpm lint / lint:fix          # eslint
pnpm check-scripts            # typecheck node-side scripts
```

no names = all plugins. `dev` needs Settings > Plugins > developer mode on in that exact app (beta
and release are separate), `no reply from ...` means it's off.

the husky pre-commit hook checks only what the commit touches, skip with `--no-verify` or
`SKIP_PRE_COMMIT=1`.

## releases

release `v<N>` carries every `<plugin>.inu.js` with version `N`, attested by github actions:

```sh
gh attestation verify noads.inu.js --repo idkmaybedeveloper/tosbreaker
```

to cut one: optionally write `changelogs/<N>.md`, push, `gh workflow run release.yml`. N is the
highest `v*` tag plus one. per-commit `dev` builds are in the `build` workflow artifacts.

## adding a plugin

one plugin per feature: grants stay minimal and one breaking doesn't take the others down.

1. `src/<plugin>/index.ts`
2. an entry in `inu.config.ts`, `id` as `lain.tosbreaker.<plugin>` (never change it afterwards)
3. a section in `FEATURES.md`

shared code goes in `src/shared/` (bundled into each plugin), switches go through `Toggle`, which
registers handlers only while on. runtime rules are in `AGENTS.md`.

every `unsafe.*` grant needs a `// SAFETY: <grant>: <reason>` where it's used, saying why no public
api covers it. if one does, use that instead.
