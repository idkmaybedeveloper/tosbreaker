# tosbreaker plugins

> one section per plugin in this repo, in `inu.config.ts` order.
> keep this updated as plugins/features are added/removed.

every plugin is installed on its own, everything inside is toggleable in its settings, defaults are
"break the tos".

## `noads`

- hide sponsored messages in channels, bot chats and the video player (`messages.getSponsoredMessages` answers empty, the request never leaves the device)
- hide sponsored results in search (`contacts.getSponsoredPeers`)
- hide the proxy sponsored channel pinned in the chat list while using an MTProxy; psa announcements are left alone, pending suggestions from the same response are lost