// Contexto del carrito de compras. Va en su propio archivo para no romper el Fast Refresh de Vite.
// El valor real lo da CartProvider (respaldado por el documento carts/{uid}); empieza en null.
import { createContext } from 'react'

export const CartContext = createContext(null)
