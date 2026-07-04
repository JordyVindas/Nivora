import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useOrders } from '../hooks/useOrders'
import { STATUS_LABEL } from '../data/orderStatus'
import { compressImageToDataUrl } from '../utils/compressImage'
import Header from './Header'
import Footer from './Footer'
import './Profile.css'

// Página de perfil: datos personales, dirección de envío en Costa Rica,
// foto de perfil, cambio de contraseña, historial de pedidos y accesos de admin.

const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']

const EMPTY_ADDRESS = { province: '', canton: '', district: '', details: '', postalCode: '', phone: '' }

// Componente de perfil del usuario.
function Profile({ onNavigate, onCartClick, onProfileClick, onAdminClick }) {
  const { user, profile, isAdmin, updateUserProfile, resetPassword, logOut } = useAuth()
  const { orders, loading: ordersLoading } = useOrders()
  // Evita que el prefill se repita en cada re-render, solo corre la primera vez.
  const initialized = useRef(false)

  const [name, setName] = useState('')
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [addressMessage, setAddressMessage] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [expandedReceipt, setExpandedReceipt] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState('')

  // Rellena el formulario con los datos del perfil una sola vez, cuando carga.
  useEffect(() => {
    if (profile && !initialized.current) {
      setName(profile.name || '')
      setAddress({ ...EMPTY_ADDRESS, ...(profile.address || {}) })
      initialized.current = true
    }
  }, [profile])

  // Guarda el nombre en el perfil del usuario.
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileMessage('')
    try {
      await updateUserProfile({ name })
      setProfileMessage('Datos actualizados.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Guarda la dirección de envío en el perfil del usuario.
  const handleSaveAddress = async (e) => {
    e.preventDefault()
    setSavingAddress(true)
    setAddressMessage('')
    try {
      await updateUserProfile({ address })
      setAddressMessage('Dirección actualizada.')
    } finally {
      setSavingAddress(false)
    }
  }

  // Envía un correo para restablecer la contraseña.
  const handleResetPassword = async () => {
    setResetMessage('')
    try {
      await resetPassword(user.email)
      setResetMessage('Te enviamos un enlace a tu correo para cambiar tu contraseña.')
    } catch {
      setResetMessage('No se pudo enviar el enlace. Intenta de nuevo.')
    }
  }

  // Comprime la foto elegida a data URL y la guarda como foto de perfil.
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError('')
    setPhotoUploading(true)
    try {
      const dataUrl = await compressImageToDataUrl(file, { maxWidth: 300, quality: 0.8 })
      await updateUserProfile({ photoURL: dataUrl })
    } catch {
      setPhotoError('No se pudo actualizar la foto. Intenta de nuevo.')
    } finally {
      setPhotoUploading(false)
    }
  }

  return (
    <div className="profile-page">
      <Header onNavigate={onNavigate} onCartClick={onCartClick} onProfileClick={onProfileClick} showNav={false} showCart={!isAdmin} />

      <div className="profile-content">
        <div className="profile-heading">
          <div className="profile-heading-main">
            <label className="profile-photo" htmlFor="profile-photo-input">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Foto de perfil" />
              ) : (
                <span className="profile-photo-placeholder" aria-hidden="true" />
              )}
              <span className="profile-photo-edit">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 20h4L18.5 9.5a2.12 2.12 0 00-3-3L5 17v3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                id="profile-photo-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={photoUploading}
                hidden
              />
            </label>
            <div>
              <h1>Mi Perfil</h1>
              <p>Administra tus datos, dirección y contraseña.</p>
              {photoUploading && <p className="profile-photo-status">Subiendo foto…</p>}
              {photoError && <p className="profile-photo-status profile-photo-error">{photoError}</p>}
            </div>
          </div>
          {isAdmin && (
            <div className="profile-admin">
              <button type="button" className="profile-admin-secondary" onClick={() => onNavigate?.()}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Ver Tienda
              </button>
              <button type="button" className="profile-admin-primary" onClick={() => onAdminClick?.()}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                Panel de Administración
              </button>
            </div>
          )}
        </div>

        <section className="profile-section">
          <h2>Datos Personales</h2>
          <form onSubmit={handleSaveProfile}>
            <label htmlFor="profile-name">Nombre</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />

            <label htmlFor="profile-email">Correo Electrónico</label>
            <input id="profile-email" type="email" value={user.email} disabled />

            <div className="profile-section-footer">
              <button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Guardando…' : 'Guardar Cambios'}
              </button>
              {profileMessage && <span className="profile-message">{profileMessage}</span>}
            </div>
          </form>
        </section>

        <section className="profile-section">
          <h2>Contraseña</h2>
          <p className="profile-section-hint">
            Te enviaremos un enlace a tu correo para establecer una contraseña nueva.
          </p>
          <div className="profile-section-footer">
            <button type="button" onClick={handleResetPassword}>Enviar Enlace de Cambio</button>
            {resetMessage && <span className="profile-message">{resetMessage}</span>}
          </div>
        </section>

        <section className="profile-section">
          <h2>Dirección de Envío</h2>
          <form onSubmit={handleSaveAddress}>
            <div className="profile-row">
              <div>
                <label htmlFor="profile-province">Provincia</label>
                <select
                  id="profile-province"
                  value={address.province}
                  onChange={(e) => setAddress((a) => ({ ...a, province: e.target.value }))}
                >
                  <option value="">Selecciona una provincia</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-canton">Cantón</label>
                <input
                  id="profile-canton"
                  type="text"
                  value={address.canton}
                  onChange={(e) => setAddress((a) => ({ ...a, canton: e.target.value }))}
                  placeholder="Ej. Escazú"
                />
              </div>
            </div>

            <label htmlFor="profile-district">Distrito</label>
            <input
              id="profile-district"
              type="text"
              value={address.district}
              onChange={(e) => setAddress((a) => ({ ...a, district: e.target.value }))}
              placeholder="Ej. San Rafael"
            />

            <label htmlFor="profile-details">Señas / Dirección Exacta</label>
            <textarea
              id="profile-details"
              rows="3"
              value={address.details}
              onChange={(e) => setAddress((a) => ({ ...a, details: e.target.value }))}
              placeholder="Ej. 200 metros norte de la iglesia católica, casa color celeste, portón negro"
            />

            <div className="profile-row">
              <div>
                <label htmlFor="profile-postal">Código Postal (opcional)</label>
                <input
                  id="profile-postal"
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))}
                  placeholder="10203"
                />
              </div>
              <div>
                <label htmlFor="profile-phone">Teléfono</label>
                <input
                  id="profile-phone"
                  type="tel"
                  value={address.phone}
                  onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                  placeholder="+506 0000 0000"
                />
              </div>
            </div>

            <div className="profile-section-footer">
              <button type="submit" disabled={savingAddress}>
                {savingAddress ? 'Guardando…' : 'Guardar Dirección'}
              </button>
              {addressMessage && <span className="profile-message">{addressMessage}</span>}
            </div>
          </form>
        </section>

        <section className="profile-section">
          <h2>Historial de Pedidos</h2>
          {ordersLoading && <p className="profile-empty">Cargando pedidos…</p>}
          {!ordersLoading && orders.length === 0 && <p className="profile-empty">Aún no tienes pedidos.</p>}
          {!ordersLoading && orders.length > 0 && (
            <div className="profile-orders">
              {orders.map((order) => (
                <div className="profile-order" key={order.id}>
                  <div className="profile-order-header">
                    <span className="profile-order-id">Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`profile-order-status status-${order.status}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                  <p className="profile-order-items">
                    {order.items.map((it) => `${it.quantity} × ${it.name}`).join(', ')}
                  </p>
                  <div className="profile-order-footer">
                    <span className="profile-order-total">${order.total.toFixed(2)}</span>
                    {order.payment?.receiptImage && (
                      <img
                        className="profile-order-receipt"
                        src={order.payment.receiptImage}
                        alt="Comprobante de pago"
                        onClick={() => setExpandedReceipt(order.payment.receiptImage)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <button type="button" className="profile-logout" onClick={logOut}>
          Cerrar Sesión
        </button>
      </div>

      {expandedReceipt && (
        <div className="profile-receipt-overlay" onClick={() => setExpandedReceipt('')}>
          <img src={expandedReceipt} alt="Comprobante de pago ampliado" />
        </div>
      )}

      <Footer />
    </div>
  )
}

export default Profile
