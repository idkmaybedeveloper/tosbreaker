# `tosbreaker`

tos breaking features in inugram since UHHHH how much?

a repo of separate inugram plugins, installed one by one: `src/<plugin>/` each, sharing code
through `src/shared/`. what's inside: [FEATURES.md](FEATURES.md).

## setup

the inugram plugin sdk (`@inugram/cli`, `@inugram/plugin-types`) isn't published yet, so it's
linked from an inugram checkout on the `plugins` branch, expected **next to this repo**:

<!--TODO: update after inugram plugins officially released -->
```sh
git clone -b plugins https://github.com/teidesu/inugram.git ../inugram
pnpm setup-sdk
```

`setup-sdk` builds the cli, generates the TL typings the sdk needs and runs `pnpm install` here.
first run sparse-clones a bit of stock telegram into `.sdk-cache/` (skipped if the inugram
checkout has a `worktree/`). checkout lives elsewhere? `INUGRAM_DIR=/path/to/inugram pnpm setup-sdk`,
but the `link:` paths in `package.json` still expect `../inugram`, so a symlink is easier.

rerun it after pulling inugram.

requirements: node >= 24 (the sdk build needs it), pnpm, git, adb for `dev`.

## usage

```sh
pnpm check [plugin...]        # manifest, grants, typecheck
pnpm build [plugin...]        # -> dist/<plugin>.inu.js
pnpm dev [plugin...]          # push + hot reload
pnpm dev:release [plugin...]  # same for desu.inugram
pnpm lint / lint:fix          # eslint, same config as inugram
pnpm check-scripts            # typecheck node-side scripts and the eslint config
```

`dev` needs the app running with Settings > Plugins > developer mode on, **in that exact app**:
beta and release have separate settings. `no reply from ...` means it's off or you picked the
wrong one.

no plugin names = all of them. or just send `dist/<plugin>.inu.js` to yourself and tap it.

### pre-commit

`pnpm install` sets up a husky hook (`scripts/pre-commit.ts`) that checks only what the commit
touches: eslint over staged files, `inu check` if plugin code or config changed, `check-scripts`
if scripts changed. skip it with `git commit --no-verify` or `SKIP_PRE_COMMIT=1`.

### global `inu`

optional, the scripts above use the local one:

```sh
cd ../inugram/sdk/cli/dist && pnpm link --global
```

## releases

each plugin is released on its own as `<plugin>-v<version>`. grab its `.inu.js` from
[releases](../../releases), every file there is attested by github actions. to check the file you
got was built by this repo's CI from the tagged commit:

```sh
gh attestation verify noads.inu.js --repo idkmaybedeveloper/tosbreaker
```

per-commit builds (unattested) are in the `build` workflow's artifacts.

cutting one: bump the plugin's `version` in `inu.config.ts`, push, then run the `release` workflow
with the plugin's key (`gh workflow run release.yml -f plugin=noads`). it builds, attests and
publishes `<plugin>-v<version>`, with notes since that plugin's previous release; it refuses to
overwrite an existing tag.

## adding a plugin

one plugin per thing it does, not a combo plugin with everything inside: people install what they
want, grants stay minimal, and one breaking doesn't take the others down.

1. `src/<plugin>/index.ts`, registering its own settings page if it has any
2. an entry under `plugins` in `inu.config.ts` with its manifest and grants, `id` as
   `lain.tosbreaker.<plugin>`
3. a section in `FEATURES.md`

code used by more than one plugin goes in `src/shared/`: it's bundled into each plugin separately,
nothing is shared at runtime. `localStorage` is per plugin, no key prefixes needed.

on/off switches go through `Toggle` (`src/shared/toggle.ts`): it registers the handler only while
the switch is on and disposes it when turned off. don't register once and check the flag inside
the handler, every call would still cross into js for nothing.

never change the manifest `id`, it decides whether an install updates the plugin or lands beside it.
see `AGENTS.md` for runtime rules