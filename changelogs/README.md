`<build>.md` here becomes the notes of release `v<build>`. without it the
release gets github's generated notes since the previous `v*` tag.

the next build is the highest `v<N>` tag plus one (`node scripts/version.ts`
after `git fetch --tags`).

only `##` sections with `-` bullets, empty ones omitted, one bullet per
user-visible change, starting with the plugin it's about:

```md
## New

- noads: hides sponsored stories

## Fixed

- noads: promo channel coming back after relogin
```
