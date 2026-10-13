/*
 * Plugin strings follow the app's language, which `inu.info()` reports. Each plugin bundles its own
 * copy of this file: plugins run in separate engines and share nothing at runtime.
 *
 * only english and russian are provided, matching what this repo ships; anything else falls back to
 * english.
 */

const RUSSIAN = 'ru'

function isRussian(): boolean {
  return inu.info().language.toLowerCase().startsWith(RUSSIAN)
}

/** Pick the english or russian string for the app's current language. */
export function localized(en: string, ru: string): string {
  return isRussian() ? ru : en
}
