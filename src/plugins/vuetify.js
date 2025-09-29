import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

const light = {
  dark: false,
  colors: {
    primary: '#2563eb',   // azul elegante
    secondary: '#64748b', // slate
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f6f8fb',
    surface: '#ffffff',
  },
}

const dark = {
  dark: true,
  colors: {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    background: '#0b1220',
    surface: '#0f172a',
  },
}

export const vuetify = createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'light',
    themes: { light, dark },
  },
  defaults: {
    VCard: { elevation: 1, rounded: 'xl' },
    VBtn: { rounded: 'lg', color: 'primary', variant: 'flat' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VDataTable: { density: 'comfortable' },
    VAlert: { rounded: 'lg' },
  },
})
