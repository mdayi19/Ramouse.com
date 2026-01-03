/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_REVERB_APP_KEY: string
    readonly VITE_REVERB_HOST: string
    readonly VITE_REVERB_PORT: string
    readonly VITE_REVERB_SCHEME: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register' {
    export interface RegisterSWOptions {
        immediate?: boolean
        onNeedRefresh?: () => void
        onOfflineReady?: () => void
        onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
        onRegisterError?: (error: any) => void
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}
