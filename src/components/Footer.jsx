// Footer del sitio con texto de marca y formulario de boletín.
// El boletín escribe directo a Firestore (colección de solo escritura), sin backend propio.
import { useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import './Footer.css'

// Renderiza el footer, incluyendo el formulario de suscripción al boletín.
function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  // Guarda al suscriptor usando el correo en minúsculas como id, para evitar duplicados.
  const handleSubscribe = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      await setDoc(doc(db, 'newsletterSubscribers', email.toLowerCase()), {
        email: email.toLowerCase(),
        subscribedAt: serverTimestamp(),
      })
      setStatus('success')
      setEmail('')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    }
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <span className="site-footer-logo">NIVORA</span>
        <p>
          © 2026 NIVORA. Moda Editorial de Alta Gama. Elevando el estándar
          del vestir moderno a través de la precisión y el minimalismo.
        </p>
      </div>
      <div className="site-footer-col site-newsletter">
        <h4>Boletín</h4>
        {status === 'success' ? (
          <p className="site-newsletter-success">¡Gracias por suscribirte! Revisa tu correo pronto.</p>
        ) : (
          <>
            <p>Suscríbete y recibe acceso anticipado a nuevas colecciones e historias editoriales.</p>
            <form className="site-newsletter-input" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? '…' : 'Unirme'}
              </button>
            </form>
            {error && <p className="site-newsletter-error">{error}</p>}
          </>
        )}
      </div>
    </footer>
  )
}

export default Footer
