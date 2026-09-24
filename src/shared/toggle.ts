import { readFlag, writeFlag } from './storage.js'

export interface ToggleOptions {
  key: string
  default: boolean
  text: string
  subtitle?: string
  register: () => Disposer
}

/*
 * a persisted flag whose handlers exist only while it's on: flipping it off disposes whatever
 * `register` returned instead of leaving a handler that checks the flag and bails, so a disabled
 * feature costs no js round trip on the app's side
 */
export class Toggle {
  private disposer: Disposer | null = null

  constructor(private readonly options: ToggleOptions) {}

  get enabled(): boolean {
    return readFlag(this.options.key, this.options.default)
  }

  set enabled(value: boolean) {
    writeFlag(this.options.key, value)
    this.apply(value)
  }

  init(): void {
    this.apply(this.enabled)
  }

  check(): inu.UIElement {
    return inu.ui.check({
      text: this.options.text,
      subtitle: this.options.subtitle,
      checked: this.enabled,
      onChange: (checked) => {
        this.enabled = checked
      },
    })
  }

  private apply(on: boolean): void {
    if (on && !this.disposer) {
      this.disposer = this.options.register()
    } else if (!on && this.disposer) {
      this.disposer()
      this.disposer = null
    }
  }
}
