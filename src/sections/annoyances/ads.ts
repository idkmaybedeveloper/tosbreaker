import type { Feature } from '../../section.js'
import { readFlag, writeFlag } from '../../shared/storage.js'

const SPONSORED_MESSAGES = 'ads.sponsored_messages'
const SPONSORED_PEERS = 'ads.sponsored_peers'
const PROXY_PROMO = 'ads.proxy_promo'

export const ads: Feature = {
  setup() {
    inu.interceptRpc('messages.getSponsoredMessages', (_ctx, next) => {
      if (!readFlag(SPONSORED_MESSAGES, true)) return next()
      return { _: 'messages.sponsoredMessagesEmpty' }
    })

    inu.interceptRpc('contacts.getSponsoredPeers', (_ctx, next) => {
      if (!readFlag(SPONSORED_PEERS, true)) return next()
      return { _: 'contacts.sponsoredPeersEmpty' }
    })

    /*
     * help.promoData also carries psa announcements and pending suggestions, so only the proxy
     * sponsored channel gets dropped. stock can't handle a promoData without a peer, which is why
     * the whole response turns into promoDataEmpty instead of just losing its peer field; the
     * `expires` is kept so stock doesn't start polling it more often than the server asked for
     */
    inu.interceptRpc('help.getPromoData', async (_ctx, next) => {
      const res = await next()
      if (!readFlag(PROXY_PROMO, true) || res?._ !== 'help.promoData' || !res.proxy) return res
      return { _: 'help.promoDataEmpty', expires: res.expires }
    })
  },

  settings: () => [
    inu.ui.header('Ads'),
    inu.ui.check({
      text: 'hide sponsored messages',
      subtitle: 'channels, bots and videos',
      checked: readFlag(SPONSORED_MESSAGES, true),
      onChange: checked => writeFlag(SPONSORED_MESSAGES, checked),
    }),
    inu.ui.check({
      text: 'hide sponsored search results',
      checked: readFlag(SPONSORED_PEERS, true),
      onChange: checked => writeFlag(SPONSORED_PEERS, checked),
    }),
    inu.ui.check({
      text: 'hide proxy sponsored channel',
      subtitle: 'the pinned channel when using mtproxy',
      checked: readFlag(PROXY_PROMO, true),
      onChange: checked => writeFlag(PROXY_PROMO, checked),
    }),
    inu.ui.separator('already loaded ads can stay until the chat is reopened.'),
  ],
}