import { api } from './api'

// En desarrollo se usa un repositorio de prueba aislado. Para integrar el backend:
// VITE_DATA_SOURCE=api npm run dev. Producción siempre compila solo el cliente HTTP.
export const isDemoMode = import.meta.env.DEV && import.meta.env.VITE_DATA_SOURCE !== 'api'
export const service: typeof api = isDemoMode ? (await import('./mockApi')).mockApi : api
