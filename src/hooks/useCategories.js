// Hook con las categorías de productos por departamento, para filtros y formularios de admin.
// Si no hay datos en Firestore, usa las categorías por defecto de departments.js.
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { DEPARTMENTS } from '../data/departments'

// Mapa de categorías por defecto, armado desde los departamentos estáticos.
const DEFAULT_CATEGORIES = Object.fromEntries(
  Object.entries(DEPARTMENTS).map(([key, dept]) => [key, dept.categories]),
)

// Se suscribe en tiempo real a settings/categories y devuelve las categorías
// por departamento, combinadas con los valores por defecto.
export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'settings', 'categories')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      // Combina con los valores por defecto para no perder categorías no configuradas.
      setCategories(snapshot.exists() ? { ...DEFAULT_CATEGORIES, ...snapshot.data() } : DEFAULT_CATEGORIES)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { categories, loading }
}
