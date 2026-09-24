export interface Feature {
  setup: () => void
  settings: () => inu.UIElement[]
}

export interface Section {
  title: string
  subtitle?: string
  icon: Parameters<typeof inu.icons.common>[0]
  features: Feature[]
}
