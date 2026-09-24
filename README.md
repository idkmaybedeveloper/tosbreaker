# `tosbreaker`

tos breaking features in inugram since UHHHH how much?

one inugram plugin, split into sections (`src/sections/`), each with its own page in the plugin's
settings. what's inside: [FEATURES.md](FEATURES.md).

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
pnpm check        # manifest, grants, typecheck
pnpm build        # -> dist/tosbreaker.inu.js
pnpm dev          # push + hot reload
pnpm dev:release  # same for desu.inugram
```

`dev` needs the app running with Settings > Plugins > developer mode on, **in that exact app**:
beta and release have separate settings. `no reply from ...` means it's off or you picked the
wrong one.

or just send `dist/tosbreaker.inu.js` to yourself and tap it.

### global `inu`

optional, the scripts above use the local one:

```sh
cd ../inugram/sdk/cli/dist && pnpm link --global
```

## releases

grab `tosbreaker.inu.js` from [releases](../../releases), every build there is attested by github
actions. to check the file you got was built by this repo's CI from the tagged commit:

```sh
gh attestation verify tosbreaker.inu.js --repo <owner>/tosbreaker
```

per-commit builds (unattested) are in the `build` workflow's artifacts.

cutting one: bump `version` in `inu.config.ts`, push, run the `release` workflow. it builds, attests
and publishes `v<version>`; it refuses to overwrite an existing tag.

## adding a feature

1. `src/sections/<section>/<name>.ts` exporting a `Feature` (`setup()` + `settings()`, see `src/section.ts`)
2. add it to that section's `features` in `src/sections/<section>/index.ts`
3. new section? `src/sections/<section>/index.ts` exporting a `Section`, then add it to `sections` in `src/index.ts`
4. add the grants it needs to `inu.config.ts`
5. prefix its `localStorage` keys with `<name>.`: all features share one plugin storage
6. update `FEATURES.md`

on/off switches go through `Toggle` (`src/shared/toggle.ts`): it registers the handler only while
the switch is on and disposes it when turned off. don't register once and check the flag inside
the handler, every call would still cross into js for nothing.

never change the manifest `id`, it decides whether an install updates the plugin or lands beside it.
see `AGENTS.md` for runtime rules