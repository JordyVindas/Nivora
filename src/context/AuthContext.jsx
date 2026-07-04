// Provider de autenticación y perfil de usuario. Envuelve Firebase Auth
// (email/contraseña y Google) y refleja cada usuario en users/{uid}
// (rol, nombre, email, dirección, foto), que es la fuente de verdad para
// cosas que Firebase Auth no guarda, como el rol de admin.
import { useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { AuthContext } from './authContextObject'

// Crea el perfil en users/{uid} si no existe todavía. Se puede llamar en
// cada login sin riesgo, porque no toca un perfil ya existente.
async function ensureUserProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    await setDoc(ref, {
      name: firebaseUser.displayName || '',
      email: firebaseUser.email,
      role: 'user',
      address: null,
      createdAt: serverTimestamp(),
    })
  }
}

// Provider de auth, consumido con useAuth(). Escucha el estado de Firebase
// Auth (creando el perfil si falta) y se suscribe en tiempo real a users/{uid}
// para reflejar cambios de rol, nombre, dirección o foto al instante.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
      if (firebaseUser) {
        ensureUserProfile(firebaseUser)
      } else {
        setProfile(null)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setProfile(snapshot.exists() ? snapshot.data() : null)
    })
  }, [user])

  const signUp = (email, password) => createUserWithEmailAndPassword(auth, email, password)
  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)
  const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

  // Actualiza parcialmente el perfil del usuario actual (nombre, dirección, foto, etc.).
  const updateUserProfile = (fields) => updateDoc(doc(db, 'users', user.uid), fields)

  const value = {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    updateUserProfile,
    logOut: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
