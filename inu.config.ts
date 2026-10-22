import { defineConfig } from '@inugram/cli'

const VERSION = process.env.TOSBREAKER_BUILD || 'dev'

export default defineConfig({
  plugins: {
    noads: {
      entry: 'src/noads/index.ts',
      manifest: {
        id: 'lain.tosbreaker.noads',
        name: 'no ads',
        author: 'bitracker',
        version: VERSION,
        description: {
          en: 'hides sponsored messages, sponsored search results and the proxy promo channel',
          ru: 'скрывает рекламу в каналах, рекламу в поиске и промо-канал прокси',
        },
        icon: 'inu://eyeOff',
        grants: [
          'interceptRpc(messages.getSponsoredMessages,contacts.getSponsoredPeers,help.getPromoData)',
        ],
      },
    },
    nostatuses: {
      entry: 'src/nostatuses/index.ts',
      manifest: {
        id: 'lain.tosbreaker.nostatuses',
        name: 'no statuses',
        author: 'damir, sophietelle',
        version: VERSION,
        description: {
          en: 'hides your read, typing and online statuses',
          ru: 'скрывает ваш статус прочтения, печатанья и онлайна',
        },
        icon: 'inu://mute',
        grants: [
          'interceptRpc(messages.readHistory,messages.readMessageContents,channels.readHistory,channels.readMessageContents,messages.readDiscussion,messages.readSavedHistory,messages.setTyping,messages.setEncryptedTyping,account.updateStatus,messages.sendMessage,messages.sendMedia,messages.sendMultiMedia,messages.forwardMessages,messages.sendInlineBotResult,messages.sendReaction,messages.editMessage,messages.sendVote,stories.sendStory)',
          'invokeRpc(account.updateStatus)',
          'account.write(read)',
        ],
      },
    },
    onetimeallower: {
      entry: 'src/onetimeallower/index.ts',
      manifest: {
        id: 'lain.tosbreaker.onetimeallower',
        name: 'one-time allower',
        author: 'bitracker',
        version: VERSION,
        description: {
          en: 'screenshots and saving for one-time photos, videos and voice messages, without telling the sender',
          ru: 'скриншоты и сохранение одноразовых фото, видео и голосовых, без уведомления отправителю',
        },
        icon: 'inu://bookmark',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      },
    },
    screenallower: {
      entry: 'src/screenallower/index.ts',
      manifest: {
        id: 'lain.tosbreaker.screenallower',
        name: 'screen allower',
        author: 'bitracker',
        version: VERSION,
        description: {
          en: 'allows screenshots everywhere and ignores "restrict saving content" in chats',
          ru: 'разрешает скриншоты везде и игнорирует запрет на сохранение контента в чатах',
        },
        icon: 'inu://download',
        grants: ['unsafe.jvm', 'unsafe.xposed'],
      },
    },
    deletedmessage: {
      entry: 'src/deletedmessage/index.ts',
      manifest: {
        id: 'lain.tosbreaker.deletedmessage',
        name: 'keep deleted messages',
        author: '@prada101010',
        version: VERSION,
        description: {
          en: 'keeps deleted messages visible and dims them',
          ru: 'оставляет удалённые сообщения видимыми и затеняет их',
        },
        icon: 'inu://delete',
        grants: [
          'interceptUpdate(updateDeleteMessages,updateDeleteChannelMessages)',
          'fs',
          'unsafe.jvm',
          'unsafe.xposed',
        ],
      },
    },
    edithistory: {
      entry: 'src/edithistory/index.ts',
      manifest: {
        id: 'lain.tosbreaker.edithistory',
        name: 'edit history',
        author: '@prada101010',
        version: VERSION,
        description: {
          en: 'keeps the previous versions of edited messages',
          ru: 'хранит предыдущие версии отредактированных сообщений',
        },
        icon: 'inu://edit',
        grants: [
          'onUpdate(new_message,edit_message)',
          'fs',
        ],
      },
    },
  },
})
