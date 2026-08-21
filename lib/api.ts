// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api" || "https://onno-rokom-backend.onrender.com/api"

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown
}

export async function apiClient(endpoint: string, options: RequestOptions = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("AUTH_TOKEN") : null

  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const { body, ...restOptions } = options

  const config: RequestInit = {
    ...restOptions,
    headers,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const baseUrl = API_BASE_URL.replace(/\/$/, "")
  const cleanEndpoint = endpoint.replace(/^\//, "")
  const targetUrl = `${baseUrl}/${cleanEndpoint}`

  try {
    const response = await fetch(targetUrl, config)

    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a minute and try again.")
    }

    // REAL-TIME KICKOUT: If backend returns 401 Unauthorized, the session has expired
    if (response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("AUTH_TOKEN")
        document.cookie = "AUTH_TOKEN=; path=/; max-age=0; SameSite=Lax"
        
        // Extract current locale from path to preserve language selection during redirect
        const locale = window.location.pathname.split("/")[1] || "en"
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/${locale}/sign-in`
      }
      throw new Error("Session expired. Please sign in again.")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return {}
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("An unexpected network error occurred.")
  }
}