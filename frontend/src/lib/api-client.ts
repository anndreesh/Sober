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

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const STORAGE_KEY = 'sober-free-auth'
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://sober-api-eofi.onrender.com').replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 30_000
const LOGIN_TIMEOUT_MS = 60_000
const RETRY_DELAY_MS = 1_000

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

function isRetryable(method: string) {
  return method === 'GET' || method === 'HEAD'
}

async function wait(milliseconds: number) {
  await new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession()
  const headers = new Headers(options.headers ?? {})
  headers.set('Content-Type', 'application/json')

  if (session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  const method = (options.method ?? 'GET').toUpperCase()
  const timeoutMs = method === 'POST' && path === '/api/v1/auth/login' ? LOGIN_TIMEOUT_MS : REQUEST_TIMEOUT_MS
  const attempts = isRetryable(method) ? 2 : 1

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let message = errorText || 'Error de la solicitud'
        try {
          const payload = JSON.parse(errorText) as { detail?: string }
          message = payload.detail || message
        } catch {
          // El backend puede devolver texto plano.
        }
        throw new ApiError(message, response.status)
      }

      if (response.status === 204) return undefined as T
      return (await response.json()) as T
    } catch (error) {
      if (error instanceof ApiError || attempt === attempts - 1) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ApiError('El servidor tardó demasiado en responder. Intenta de nuevo.', 408)
        }
        throw error
      }
      await wait(RETRY_DELAY_MS)
    } finally {
      window.clearTimeout(timeout)
    }
  }

  throw new ApiError('No se pudo completar la solicitud.', 500)
}
