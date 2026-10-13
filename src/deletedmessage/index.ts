import { localized } from '../shared/i18n.js'
import { Toggle } from '../shared/toggle.js'
import { installDeletedMarking, setDeletedMarking } from './mark.js'
import { recordChannelDeletion, recordCommonBoxDeletion } from './store.js'

const keepDeleted = new Toggle({
  key: 'keep_deleted',
  default: true,
  text: localized('Keep deleted messages', 'Оставлять удалённые сообщения'),
  subtitle: localized(
    'Keep deleted messages visible and dim them.',
    'Оставлять удалённые сообщения видимыми и затенять их.',
  ),
  register: () => inu.interceptUpdate(
    ['updateDeleteMessages', 'updateDeleteChannelMessages'],
    (context) => {
      const update = context.update
      if (update._ === 'updateDeleteChannelMessages') recordChannelDeletion(context.account.id, update.channel_id, update.messages)
      else recordCommonBoxDeletion(context.account.id, update.messages)
      return 'drop'
    },
  ),
  onChange: on => setDeletedMarking(on),
})

keepDeleted.init()

/*
 * The marking hooks stay installed for the plugin's lifetime: `onDraw` resets every cell's alpha on
 * each frame, so disposing them mid-session would leave a dimmed bubble dim. The toggle only flips
 * the captured AtomicBoolean.
 */
installDeletedMarking(keepDeleted.active)

inu.registerSettings(inu.ui.settingsPage({
  title: localized('deleted messages', 'удалённые сообщения'),
  items: () => [
    keepDeleted.check(),
    inu.ui.separator(localized(
      'kept bubbles disappear once the chat is refetched from the server.',
      'сохранённые сообщения исчезнут, как только чат обновится с сервера.',
    )),
  ],
}))
