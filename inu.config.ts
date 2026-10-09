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
  },
})
