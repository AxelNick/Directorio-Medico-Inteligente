import { api } from './api'

// `npm run dev` usa un repositorio de prueba aislado (datos ficticios, sin llamar al backend).
// Para integrar el backend real: `npm run dev:api` (`vite --mode api`) o VITE_DATA_SOURCE=api.
// Producción siempre compila solo el cliente HTTP: import.meta.env.DEV es falso y el mock no se incluye.
const wantsApi = import.meta.env.VITE_DATA_SOURCE === 'api' || import.meta.env.MODE === 'api'
export const isDemoMode = import.meta.env.DEV && !wantsApi
/** Desarrollo contra el backend real: se señala en pantalla para no confundirlo con la demostración. */
export const isDevApiMode = import.meta.env.DEV && wantsApi
export const service: typeof api = isDemoMode ? (await import('./mockApi')).mockApi : api
