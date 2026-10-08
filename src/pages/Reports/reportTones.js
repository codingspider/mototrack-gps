// Colors for a tone name used by report cards, badges and rows: 'primary' | 'success' | 'warning' | 'danger' | 'muted'.

/** @returns {{ fg: string, bg: string }} text/icon color and its soft background */
export function getToneColors(tone, colors) {
  switch (tone) {
    case 'success':
      return { fg: colors.statusOnline, bg: colors.statusOnlineSoft };
    case 'warning':
      return { fg: colors.accent, bg: colors.accentSoft };
    case 'danger':
      return { fg: colors.secondary, bg: colors.secondarySoft };
    case 'muted':
      return { fg: colors.statusOffline, bg: colors.statusOfflineSoft };
    default:
      return { fg: colors.primary, bg: colors.primarySoft };
  }
}
