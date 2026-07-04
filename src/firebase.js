// Inicializa Firebase para Nivora y exporta auth, db (Firestore) y googleProvider.
// No se usa Firebase Storage (plan gratuito); las imágenes se guardan como Base64 en Firestore.
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBn6sIi2zKtaDdP223_nH-flEcbQNJ1B4Q',
  authDomain: 'nivora-b2eb3.firebaseapp.com',
  projectId: 'nivora-b2eb3',
  storageBucket: 'nivora-b2eb3.firebasestorage.app',
  messagingSenderId: '219134856425',
  appId: '1:219134856425:web:11eeecfc612291f5963478',
  measurementId: 'G-Z2DPBNLRTL',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
