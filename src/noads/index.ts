import { Toggle } from '../shared/toggle.js'

const sponsoredMessages = new Toggle({
  key: 'sponsored_messages',
  default: true,
  text: 'hide sponsored messages',
  subtitle: 'channels, bots and videos',
  register: () => inu.interceptRpc('messages.getSponsoredMessages', () => ({ _: 'messages.sponsoredMessagesEmpty' })),
})

const sponsoredPeers = new Toggle({
  key: 'sponsored_peers',
  default: true,
  text: 'hide sponsored search results',
  register: () => inu.interceptRpc('contacts.getSponsoredPeers', () => ({ _: 'contacts.sponsoredPeersEmpty' })),
})

/*
 * promoData also carries psa and pending suggestions, so only proxy responses are dropped.
 * stock crashes on a promoData without a peer, hence promoDataEmpty instead of removing the
 * peer. `expires` stays so stock doesn't poll more often than asked
 */
const proxyPromo = new Toggle({
  key: 'proxy_promo',
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
for (const toggle of toggles) toggle.init()

inu.registerSettings(inu.ui.settingsPage({
  title: 'no ads',
  items: () => [
    ...toggles.map(toggle => toggle.check()),
    inu.ui.separator('already loaded ads can stay until the chat is reopened.'),
  ],
}))
