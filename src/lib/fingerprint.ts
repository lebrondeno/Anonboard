// Lightweight anonymous device fingerprint
// Used for rate limiting and duplicate prevention
// Does NOT identify the person — just the browser/device session

export function getDeviceId(): string {
  const key = 'whispr_device_id'
  const saved = localStorage.getItem(key)
  if (saved) return saved
  // Combine several stable signals
  const nav = navigator
  const signals = [
    nav.language,
    nav.platform,
    nav.hardwareConcurrency,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ].join('|')
  // Simple hash
  let hash = 0
  for (let i = 0; i < signals.length; i++) {
    hash = ((hash << 5) - hash + signals.charCodeAt(i)) | 0
  }
  const id = Math.abs(hash).toString(36) + '_' + Math.random().toString(36).slice(2, 8)
  localStorage.setItem(key, id)
  return id
}

// Check if this device already submitted to a session
export function hasSubmitted(sessionId: string): boolean {
  const key = `submitted_${sessionId}`
  return localStorage.getItem(key) === '1'
}

export function markSubmitted(sessionId: string): void {
  localStorage.setItem(`submitted_${sessionId}`, '1')
}

// Rate limit: max N submissions per session per device
export function getSubmissionCount(sessionId: string): number {
  return parseInt(localStorage.getItem(`count_${sessionId}`) ?? '0', 10)
}

export function incrementSubmissionCount(sessionId: string): void {
  const count = getSubmissionCount(sessionId)
  localStorage.setItem(`count_${sessionId}`, String(count + 1))
}
