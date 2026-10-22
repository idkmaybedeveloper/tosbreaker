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

- hide online status, aka ghost mode (`account.updateStatus`); forces the two below on
  - ghost mode shortcut in the chat list context menu
- hide read receipts (`messages.readHistory`, `channels.readHistory`, `readMessageContents`, `messages.readDiscussion`, `messages.readSavedHistory` answer locally)
  - "mark as read" in the message menu
- hide typing status (`messages.setTyping`, `messages.setEncryptedTyping`)

## `onetimeallower`

needs `unsafe.jvm` + `unsafe.xposed`: `FLAG_SECURE`, the message menu and screenshot detection all
live in app ui code, no public plugin api reaches them.

- screenshots of one-time media: `FLAG_SECURE` is stripped only from the `SecretMediaViewer` window (photos, videos) and the `SecretVoicePlayer` dialog (voice and round "once")
- "save to gallery" in the message menu for one-time media: `needDrawBluredPreview`/`isVoiceOnce`/`isRoundOnce` answer false only while `ChatActivity.createMenu` runs. photos are already on disk, videos have to be loaded first; view-once disappears after viewing, so save before opening
- no screenshot notifications: `MediaController.checkScreenshots` is skipped, so neither `messages.sendScreenshotNotification` nor the secret chat screenshot action is sent

## `screenallower`

needs `unsafe.jvm` + `unsafe.xposed`: same as `onetimeallower`, plus `noforwards` is enforced in
app ui code, and stripping it from api responses would mean rewriting every method returning chats
or messages.

- screenshots everywhere: `FLAG_SECURE` is stripped in `Window.setFlags`/`setAttributes` and `WindowManagerImpl.addView`/`updateViewLayout` (protected and secret chats, PhotoViewer, one-time media, stories, passcode screen, everything)
- ignore "restrict saving content": `MessagesController.isChatNoForwards`/`isUserNoForwards` answer false, `message.noforwards` is cleared when a `MessageObject` is built. copy/save/share open up; server-side forwarding is still refused
- no screenshot notifications, same as in `onetimeallower`

## `deletedmessage`

needs `unsafe.jvm` + `unsafe.xposed`: the delete update is dropped before the app applies it, and
marking the kept bubble is a drawing-time change in app ui code, no public plugin api reaches it.

- keep deleted messages: `updateDeleteMessages`/`updateDeleteChannelMessages` answer as dropped,
  and their ids are remembered in the plugin's private directory for seven days. the app leaves the
  bubble on screen
- dimming: `ChatMessageCell.setMessageObject`/`onDraw` run a compiled routine that reads the kept
  ids from a java `HashSet` and sets the bubble alpha to 50%, resetting it from the cell's current
  message on every draw so recycled cells don't leak. the toggle flips a captured `AtomicBoolean`,
  so it is instant and a dimmed bubble resets on its next draw

## `edithistory`

no unsafe grants: the whole feature is public plugin api (`onUpdate`, `registerMessageAction`,
`openChatHistory` and `fs`).

- edit history: snapshots every message (`onNewMessage`) and, on `onMessageEdited`, keeps the
  previous version before refreshing it. formatting-only edits (entity changes) count too, so a
  snapshot compares text and entities
- "edit history" in the message menu opens the stored versions in a synthetic chat page, newest
  first. at most 50 versions per message, 2000 overall and 500 snapshots, all expiring after seven
  days
