export function isSessionValid(): boolean {
  try {
    const raw = localStorage.getItem('simbara_session')
    if (!raw) return false
    const session = JSON.parse(raw) as { expiry: number }
    return Date.now() < session.expiry
  } catch {
    return false
  }
}

export function clearSession(): void {
  localStorage.removeItem('simbara_session')
}
