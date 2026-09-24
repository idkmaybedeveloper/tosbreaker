import type { Feature } from '../../section.js'
import { Toggle } from '../../shared/toggle.js'

const sponsoredMessages = new Toggle({
  key: 'ads.sponsored_messages',
  default: true,
  text: 'hide sponsored messages',
  subtitle: 'channels, bots and videos',
  register: () => inu.interceptRpc('messages.getSponsoredMessages', () => ({ _: 'messages.sponsoredMessagesEmpty' })),
})

const sponsoredPeers = new Toggle({
  key: 'ads.sponsored_peers',
  default: true,
  text: 'hide sponsored search results',
  register: () => inu.interceptRpc('contacts.getSponsoredPeers', () => ({ _: 'contacts.sponsoredPeersEmpty' })),
})

/*
 * help.promoData also carries psa announcements and pending suggestions, so only the proxy
 * sponsored channel gets dropped. stock can't handle a promoData without a peer, which is why
 * the whole response turns into promoDataEmpty instead of just losing its peer field; the
 * `expires` is kept so stock doesn't start polling it more often than the server asked for
 */
const proxyPromo = new Toggle({
  key: 'ads.proxy_promo',
  default: true,
  text: 'hide proxy sponsored channel',
  subtitle: 'the pinned channel when using mtproxy',
  register: () => inu.interceptRpc('help.getPromoData', async (_ctx, next) => {
    const res = await next()
    if (res?._ !== 'help.promoData' || !res.proxy) return res
    return { _: 'help.promoDataEmpty', expires: res.expires }
  }),
})

const toggles = [sponsoredMessages, sponsoredPeers, proxyPromo]

export const ads: Feature = {
  setup() {
    for (const toggle of toggles) toggle.init()
  },

  settings: () => [
    inu.ui.header('Ads'),
    ...toggles.map(toggle => toggle.check()),
    inu.ui.separator('already loaded ads can stay until the chat is reopened.'),
  ],
}
