import type { Section } from './section.js'
import { annoyances } from './sections/annoyances/index.js'

const sections: Section[] = [
  annoyances,
]

for (const section of sections) {
  for (const feature of section.features) feature.setup()
}

const pages = sections.map(section => inu.ui.settingsPage({
  title: section.title,
  items: () => section.features.flatMap(feature => feature.settings()),
}))

inu.registerSettings(inu.ui.settingsPage({
  title: 'tosbreaker',
  items: () => sections.map((section, i) => inu.ui.button({
    text: section.title,
    subtitle: section.subtitle,
    icon: inu.icons.common(section.icon),
    onClick: () => inu.ui.openPage(pages[i]),
  })),
}))
