// Shared design tokens - warm neutral base with two pastel accents.
// Pastels darkened one notch from the first pass so they read clearly
// against the neutral background instead of nearly disappearing.

export const theme = {
  color: {
    bg: '#F7F5F1',
    surface: '#FFFFFF',
    surfaceMuted: '#EDEAE1',
    border: '#DAD4C6',
    borderStrong: '#C7C0AE',

    textPrimary: '#2B2A27',
    textSecondary: '#63604F',
    textTertiary: '#8B8574',

    adminAccent: '#4E6E88',
    adminAccentHover: '#405C74',
    adminAccentSoft: '#D9E3EA',

    chatAccent: '#6E9163',
    chatAccentHover: '#5C7C52',
    chatAccentSoft: '#DCEAD5',

    success: '#5C9576',
    successSoft: '#DFEEE5',
    warning: '#C99149',
    warningSoft: '#F5E7D0',
    danger: '#BC6459',
    dangerSoft: '#F3DEDB',
  },
  font: "'Inter', system-ui, -apple-system, sans-serif",
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
  },
} as const
