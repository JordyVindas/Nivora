import { useContext } from 'react'
import { CartContext } from './cartContextObject'

// Da acceso al contexto del carrito (items, totales y funciones para modificarlo).
// Lanza un error si se usa fuera de CartProvider.
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
