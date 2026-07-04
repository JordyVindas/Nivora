// Pantalla combinada de inicio de sesión / registro / recuperar contraseña,
// mostrada cuando no hay usuario autenticado. Incluye login con Google.
import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import './Login.css'

// Textos de título/subtítulo/botón según el modo ('signin' | 'signup').
const COPY = {
  signin: {
    heading: 'Bienvenido de nuevo',
    subtitle: 'Ingresa tus datos para acceder a tu cuenta.',
    cta: 'Iniciar Sesión',
  },
  signup: {
    heading: 'Crear Cuenta',
    subtitle: 'Regístrate y empieza a armar tu colección.',
    cta: 'Crear Cuenta',
  },
}

const ERROR_MESSAGES = {
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/user-not-found': 'No existe una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/popup-closed-by-user': 'Se cerró la ventana de Google antes de completar el acceso.',
}

// Traduce un código de error de Firebase Auth a un mensaje en español.
function friendlyError(error) {
  return ERROR_MESSAGES[error?.code] || 'Ocurrió un error. Intenta de nuevo.'
}

// Tarjeta de login/registro con opción de Google y recuperar contraseña.
// Este componente no navega: al autenticarse, AppContent cambia de pantalla solo.
function Login() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { heading, subtitle, cta } = COPY[mode]

  // Envía el formulario: inicia sesión o crea cuenta según el modo.
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  // Abre el popup de inicio de sesión con Google.
  const handleGoogle = async () => {
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const changeMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setMessage('')
  }

  // Envía un correo de recuperación de contraseña al email ingresado.
  const handleForgotPassword = async () => {
    setError('')
    setMessage('')
    if (!email) {
      setError('Ingresa tu correo para poder enviarte el enlace de recuperación.')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(email)
      setMessage('Te enviamos un enlace a tu correo para restablecer tu contraseña.')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-visual">
          <div className="login-visual-content">
            <span className="login-brand">NIVORA</span>
            <span className="login-brand-tag">Moda con Estilo</span>
            <p>
              Únete a nuestra comunidad y descubre prendas con diseño
              cuidado y estilo único.
            </p>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-tabs" role="tablist" aria-label="Modo de autenticación">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => changeMode('signin')}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => changeMode('signup')}
            >
              Registrarse
            </button>
          </div>

          <h1>{heading}</h1>
          <p className="login-subtitle">{subtitle}</p>

          {error && <p className="login-error">{error}</p>}
          {message && <p className="login-message">{message}</p>}

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="login-field-row">
              <label htmlFor="password">Contraseña</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  className="login-forgot"
                  onClick={handleForgotPassword}
                  disabled={submitting}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="login-password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                className="login-toggle-visibility"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M3 3l18 18M10.6 10.7a2.5 2.5 0 003.5 3.5M6.5 6.6C4.3 8 2.7 10 2 12c1.8 4 5.8 7 10 7 1.7 0 3.3-.5 4.8-1.3M9.9 4.3A10.4 10.4 0 0112 4c4.2 0 8.2 3 10 7-.6 1.3-1.4 2.6-2.5 3.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2 12c1.8-4 5.8-7 10-7s8.2 3 10 7c-1.8 4-5.8 7-10 7s-8.2-3-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button type="submit" className="login-submit" disabled={submitting}>
              {submitting ? 'Un momento…' : cta}
            </button>
          </form>

          <div className="login-divider">
            <span>o</span>
          </div>

          <button
            type="button"
            className="login-google"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 014.9 12c0-.79.14-1.56.37-2.28V6.61H1.26A11.98 11.98 0 000 12c0 1.93.46 3.76 1.26 5.39l4.01-3.11z" />
              <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
            Continuar con Google
          </button>

          <div className="login-footer">
            <span>© 2026 Nivora. Acceso restringido.</span>
            <div className="login-footer-links">
              <a href="#support">Soporte</a>
              <a href="#privacy">Privacidad</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
