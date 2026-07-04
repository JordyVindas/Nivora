import { useContext } from 'react'
import { AuthContext } from './authContextObject'

// Da acceso al contexto de autenticación (usuario, perfil y funciones de login/logout).
// Lanza un error si se usa fuera de AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
