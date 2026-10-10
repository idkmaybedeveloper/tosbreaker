# tosbreaker plugins

> one section per plugin in this repo, in `inu.config.ts` order.
> keep this updated as plugins/features are added/removed.

every plugin is installed on its own, everything inside is toggleable in its settings, defaults are
"break the tos".

## `noads`

- hide sponsored messages in channels, bot chats and the video player (`messages.getSponsoredMessages` answers empty, the request never leaves the device)
- hide sponsored results in search (`contacts.getSponsoredPeers`)
- hide the proxy sponsored channel pinned in the chat list while using an MTProxy; psa announcements are left alone, pending suggestions from the same response are lost
## `nostatuses`

- hide read receipts (`messages.readHistory`, `channels.readHistory` and `readMessageContents` answer locally)
- hide typing status (`messages.setTyping`, `messages.setEncryptedTyping`)

## `onetimeallower`

needs `unsafe.jvm` + `unsafe.xposed`: `FLAG_SECURE`, the message menu and screenshot detection all
live in app ui code, no public plugin api reaches them.

- screenshots of one-time media: `FLAG_SECURE` is stripped only from the `SecretMediaViewer` window (photos, videos) and the `SecretVoicePlayer` dialog (voice and round "once")
- "save to gallery" in the message menu for one-time media: `needDrawBluredPreview`/`isVoiceOnce`/`isRoundOnce` answer false only while `ChatActivity.createMenu` runs. photos are already on disk, videos have to be loaded first; view-once disappears after viewing, so save before opening
- no screenshot notifications: `MediaController.checkScreenshots` is skipped, so neither `messages.sendScreenshotNotification` nor the secret chat screenshot action is sent
