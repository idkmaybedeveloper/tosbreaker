import { localized } from '../shared/i18n.js'
import { Toggle } from '../shared/toggle.js'
import { installEditHistory, trackEdit } from './history.js'

// Tracking runs regardless of the toggle, so history exists by the time it is switched on.
inu.onNewMessage((message, account) => trackEdit(message, account.id))
inu.onMessageEdited((message, account) => trackEdit(message, account.id))

const editHistory = new Toggle({
  key: 'edit_history',
  default: true,
  text: localized('Edit History', 'История изменений'),
  subtitle: localized(
    'Keep previous message text versions, up to seven days.',
    'Хранить предыдущие версии текста сообщений, до семи дней.',
  ),
  register: installEditHistory,
})

editHistory.init()

inu.registerSettings(inu.ui.settingsPage({
  title: localized('edit history', 'история изменений'),
  items: () => [
    editHistory.check(),
    inu.ui.separator(localized(
      'open a message menu to see its versions.',
      'откройте меню сообщения, чтобы увидеть его версии.',
    )),
  ],
}))
