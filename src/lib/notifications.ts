// Push notification helper (PWA)
// Asks for permission once, then sends local notifications

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function notifyNewResponse(sessionTitle: string, count: number) {
  if (Notification.permission !== 'granted') return
  try {
    new Notification('Whispr — New response', {
      body: `${sessionTitle} now has ${count} response${count !== 1 ? 's' : ''}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'whispr-response', // replaces previous notification instead of stacking
    })
  } catch {}
}

export function notifyNewMessage(sessionTitle: string, anonName: string) {
  if (Notification.permission !== 'granted') return
  try {
    new Notification('Whispr — New message', {
      body: `${anonName} sent a message in "${sessionTitle}"`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'whispr-message',
    })
  } catch {}
}
