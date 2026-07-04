import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Escucha en tiempo real el documento settings/policies (datos de SINPE, envío y políticas de la tienda).
// Así los cambios del admin se ven al instante en el checkout.
export function useStorePolicies() {
  const [policies, setPolicies] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ref = doc(db, 'settings', 'policies')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setPolicies(snapshot.exists() ? snapshot.data() : null)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return { policies, loading }
}
