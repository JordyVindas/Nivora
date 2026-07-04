// Contexto de autenticación. Va en su propio archivo para no romper el Fast Refresh de Vite.
// El valor real lo da AuthProvider; empieza en null.
import { createContext } from 'react'

export const AuthContext = createContext(null)
