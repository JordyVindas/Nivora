// Estado del carrito respaldado en Firestore (un doc por usuario en carts/{uid}).
// Solo guarda { productId, size, quantity }; los datos del producto se
// combinan con el catálogo en vivo para que nunca queden desactualizados.
// Solo se usa para usuarios ya autenticados (ver AppContent en App.jsx).
import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './useAuth'
import { useProducts } from '../hooks/useProducts'
import { CartContext } from './cartContextObject'

// Provider del carrito, consumido con useCart(). Se suscribe en tiempo real
// a carts/{uid} y combina cada línea con el catálogo actual. Cada cambio se
// aplica primero en local (optimista) y luego se guarda en Firestore.
export function CartProvider({ children }) {
  const { user } = useAuth()
  const { products } = useProducts()
  const [rawItems, setRawItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'carts', user.uid)
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setRawItems(snapshot.exists() ? snapshot.data().items || [] : [])
      setLoading(false)
    })
    return unsubscribe
  }, [user.uid])

  // Guarda el array de items en carts/{uid} (merge para no pisar otros campos).
  const persist = (items) => {
    setDoc(doc(db, 'carts', user.uid), { items }, { merge: true })
  }

  // Agrega el producto/talla al carrito; si ya existe, suma la cantidad en vez de duplicar.
  const addToCart = (product, size, quantity = 1) => {
    const idx = rawItems.findIndex((it) => it.productId === product.id && it.size === size)
    const next =
      idx >= 0
        ? rawItems.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + quantity } : it))
        : [...rawItems, { productId: product.id, size: size || null, quantity }]
    setRawItems(next)
    persist(next)
  }

  // Cambia la cantidad de una línea; si es 0 o menos, elimina la línea.
  const updateQuantity = (productId, size, quantity) => {
    const next =
      quantity <= 0
        ? rawItems.filter((it) => !(it.productId === productId && it.size === size))
        : rawItems.map((it) => (it.productId === productId && it.size === size ? { ...it, quantity } : it))
    setRawItems(next)
    persist(next)
  }

  const removeItem = (productId, size) => {
    const next = rawItems.filter((it) => !(it.productId === productId && it.size === size))
    setRawItems(next)
    persist(next)
  }

  const clearCart = () => {
    setRawItems([])
    persist([])
  }

  // Combina cada línea guardada con el catálogo en vivo, descartando las que
  // ya no tienen producto (por ejemplo, si un admin lo eliminó).
  const items = useMemo(() => {
    return rawItems
      .map((it) => {
        const product = products.find((p) => p.id === it.productId)
        return product ? { ...it, product } : null
      })
      .filter(Boolean)
  }, [rawItems, products])

  const subtotal = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0)
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0)

  const value = {
    items,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
