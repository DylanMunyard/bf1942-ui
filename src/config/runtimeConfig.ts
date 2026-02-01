/**
 * Runtime configuration loaded from /config.json in production.
 * The file is generated at container start from environment variables (e.g. Kubernetes Secret).
 * In development, config.json does not exist and build-time env (import.meta.env) is used instead.
 */
export interface RuntimeConfig {
  applicationInsightsConnectionString?: string
}

const configUrl = '/config.json'

/**
 * Fetches runtime config from the server. Returns null if the file does not exist (e.g. local dev)
 * or the response is not valid JSON (e.g. SPA fallback returning HTML).
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig | null> {
  try {
    const response = await fetch(configUrl, { cache: 'no-store' })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type')
    if (contentType && !contentType.includes('application/json')) return null
    const data = await response.json()
    if (typeof data !== 'object' || data === null) return null
    return data as RuntimeConfig
  } catch {
    return null
  }
}
