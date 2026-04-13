// Web Vibration API — works on Android Chrome PWA
// iOS Safari doesn't support it, but fails silently

export const haptics = {
  // Light tap — navigation, selection
  tap: () => {
    if ('vibrate' in navigator) navigator.vibrate(8)
  },
  // Success — submit, vote cast
  success: () => {
    if ('vibrate' in navigator) navigator.vibrate([10, 30, 10])
  },
  // Error — wrong PIN, failed submit
  error: () => {
    if ('vibrate' in navigator) navigator.vibrate([20, 10, 20, 10, 20])
  },
  // Reaction — emoji react
  react: () => {
    if ('vibrate' in navigator) navigator.vibrate(6)
  },
  // Heavy — delete, close session
  heavy: () => {
    if ('vibrate' in navigator) navigator.vibrate(20)
  },
}
