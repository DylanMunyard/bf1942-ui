/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly PROMETHEUS_URL?: string
    readonly VITE_LOG_ENDPOINT?: string
    readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'
    readonly VITE_LOG_BATCH_SIZE?: string
    readonly VITE_LOG_BATCH_INTERVAL?: string
    readonly VITE_LOG_DEBUG_SAMPLE_RATE?: string
    readonly VITE_LOG_MAX_BUFFER_SIZE?: string
    readonly VITE_LOG_ENABLED?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
