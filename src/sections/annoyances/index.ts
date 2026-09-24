import type { Section } from '../../section.js'
import { ads } from './ads.js'

export const annoyances: Section = {
  title: 'annoyances',
  subtitle: 'ads and other stuff telegram shoves at you',
  icon: 'eyeOff',
  features: [
    ads,
  ],
}
