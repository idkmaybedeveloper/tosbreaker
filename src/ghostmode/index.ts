import { localized } from '../shared/i18n.js'
import { Toggle } from '../shared/toggle.js'
import { installGhostRead, installGhostStory } from './ghost.js'
import { installGhostPresence } from './typing.js'

const ghostRead = new Toggle({
  key: 'ghost_read',
  default: true,
  text: localized('Ghost read', 'Призрачное чтение'),
  subtitle: localized(
    'Read messages without sending read receipts.',
    'Читать сообщения без отправки отчёта о прочтении.',
  ),
  register: installGhostRead,
})

const ghostStory = new Toggle({
  key: 'ghost_story',
  default: true,
  text: localized('Ghost story', 'Призрачные истории'),
  subtitle: localized(
    'View stories without marking them as seen.',
    'Смотреть истории, не помечая их просмотренными.',
  ),
  register: installGhostStory,
})

const ghostPresence = new Toggle({
  key: 'ghost_presence',
  default: true,
  text: localized('Ghost presence', 'Призрачное присутствие'),
  subtitle: localized(
    'Hide typing, recording, and upload indicators from others.',
    'Скрывать индикаторы набора текста, записи и загрузки от других.',
  ),
  register: installGhostPresence,
})

const toggles = [ghostRead, ghostStory, ghostPresence]
for (const toggle of toggles) toggle.init()

inu.registerSettings(inu.ui.settingsPage({
  title: localized('ghost mode', 'призрачный режим'),
  items: () => [
    ...toggles.map(toggle => toggle.check()),
    inu.ui.separator(localized(
      'unread badges and story rings can come back after a restart.',
      'счётчики непрочитанного и кольца историй могут вернуться после перезапуска.',
    )),
  ],
}))