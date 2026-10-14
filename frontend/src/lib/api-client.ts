export type SessionUser = {
  id: number
  name: string
  username: string
  email: string
  is_active?: boolean
}

export type SessionData = {
  token: string
  user: SessionUser
}

const STORAGE_KEY = 'sober-free-auth'
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export function getStoredSession(): SessionData | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored) as SessionData
  } catch {
    return null
  }
}

export function saveSession(session: SessionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession()
  const headers = new Headers(options.headers ?? {})
  headers.set('Content-Type', 'application/json')

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Error de la solicitud')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
