import { readFlag, writeFlag } from './storage.js'

export interface ToggleOptions {
  key: string
  default: boolean
  text: string
  subtitle?: string
  register: () => Disposer
  /** called after the user flips the switch, with the new stored value */
  onChange?: (on: boolean) => void
}

/*
 * a persisted flag whose handlers exist only while it's on: flipping it off disposes whatever
 * `register` returned instead of leaving a handler that checks the flag and bails, so a disabled
 * feature costs no js round trip on the app's side
 */
export class Toggle {
  private disposer: Disposer | null = null
  private forcedBy: string | null = null

  constructor(private readonly options: ToggleOptions) {}

  get enabled(): boolean {
    return readFlag(this.options.key, this.options.default)
  }

  set enabled(value: boolean) {
    writeFlag(this.options.key, value)
    this.apply(this.active)
    this.options.onChange?.(value)
  }

  /** on because the user enabled it, or because another feature forces it on */
  get active(): boolean {
    return this.forcedBy !== null || this.enabled
  }

  /*
   * keeps the feature on while `by` (the forcing feature's label) is set, without touching the
   * stored flag, so the user's own choice comes back once it's released with `null`
   */
  force(by: string | null): void {
    this.forcedBy = by
    this.apply(this.active)
  }

  init(): void {
    this.apply(this.active)
  }

  /*
   * there's no disabled switch in the ui api: while forced, flips are dropped and `refresh` is
   * called so the page redraws the switch back on
   */
  check(refresh?: () => void): inu.UIElement {
    const forcedBy = this.forcedBy
    return inu.ui.check({
      text: this.options.text,
      subtitle: forcedBy !== null ? `forced on by "${forcedBy}"` : this.options.subtitle,
      checked: this.active,
      onChange: (checked) => {
        if (forcedBy !== null) {
          refresh?.()
          return
        }
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
