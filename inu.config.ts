import { defineConfig } from '@inugram/cli'

export default defineConfig({
  plugins: {
    tosbreaker: {
      entry: 'src/index.ts',
      manifest: {
        id: 'lain.tosbreaker',
        name: 'tosbreaker',
        author: 'bitracker',
        version: '1.0.0',
        description: {
          en: 'tos breaking features',
          ru: 'фичи, нарушающие tos',
        },
        icon: 'inu://eyeOff',
        grants: [
          'interceptRpc(messages.getSponsoredMessages,contacts.getSponsoredPeers,help.getPromoData)',
        ],
      },
    },
  },
})