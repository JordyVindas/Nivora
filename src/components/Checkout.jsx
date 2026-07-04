import { useEffect, useRef, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useStorePolicies } from '../hooks/useStorePolicies'
import { calculateShipping } from '../data/shipping'
import { compressImageToDataUrl } from '../utils/compressImage'
import { getCoverImage } from '../utils/productImage'
import './Checkout.css'

// Página de checkout: flujo de 3 pasos (Envío → Resumen → Pago) que crea un
// pedido en Firestore. El pago es solo por SINPE Móvil: el cliente transfiere
// aparte y sube el comprobante, que un admin verifica luego en AdminOrders.jsx.

// Límite del tamaño del comprobante comprimido, para no pasar el límite de 1 MiB por documento.
const MAX_RECEIPT_LENGTH = 700_000

// Datos de SINPE por defecto, si el admin aún no configuró settings/policies.
const DEFAULT_SINPE = { sinpeNumber: '8888-8888', sinpeName: 'Nivora Costa Rica' }

const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón']

const STEPS = [
  { id: 'shipping', label: '1. Envío' },
  { id: 'summary', label: '2. Resumen' },
  { id: 'payment', label: '3. Pago' },
]

// Miniatura del producto en la línea del checkout, con ícono genérico si no hay imagen.
function CheckoutImage({ image }) {
  return (
    <div className="checkout-item-image">
      {image ? (
        <img src={image} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M9 4a3 3 0 006 0M12 4l-8 5 2 3 6-3.5L18 12l2-3-8-5zM6 8.5L4 20h16l-2-11.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// Componente de checkout.
function Checkout({ onNavigate, onCartClick }) {
  const { user, profile } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const { policies } = useStorePolicies()
  const sinpe = { ...DEFAULT_SINPE, ...(policies || {}) }
  const [step, setStep] = useState('shipping')
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '', phone: '', province: '', canton: '', district: '', details: '', postalCode: '',
  })
  const [payment, setPayment] = useState({ senderPhone: '', reference: '' })
  const [receiptData, setReceiptData] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  // Evita que el prefill se repita en cada re-render, solo corre la primera vez.
  const prefilled = useRef(false)

  // Rellena el formulario de envío con la dirección guardada en el perfil.
  useEffect(() => {
    if (profile && !prefilled.current) {
      setShippingInfo((info) => ({
        ...info,
        fullName: profile.name || '',
        phone: profile.address?.phone || '',
        province: profile.address?.province || '',
        canton: profile.address?.canton || '',
        district: profile.address?.district || '',
        details: profile.address?.details || '',
        postalCode: profile.address?.postalCode || '',
      }))
      prefilled.current = true
    }
  }, [profile])

  const shippingCost = calculateShipping(subtotal)
  const total = subtotal + shippingCost

  // Avanza del paso de envío al de resumen del pedido.
  const handleShippingSubmit = (e) => {
    e.preventDefault()
    setStep('summary')
  }

  // Comprime la foto del comprobante SINPE; si sigue muy pesada, muestra error.
  const handleReceiptChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setCompressing(true)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      if (dataUrl.length > MAX_RECEIPT_LENGTH) {
        setError('La imagen sigue siendo muy pesada incluso comprimida. Intenta con otra foto.')
        setReceiptData('')
      } else {
        setReceiptData(dataUrl)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setCompressing(false)
    }
  }

  // Crea el pedido en Firestore con estado 'pendiente', vacía el carrito
  // y pasa a la confirmación. Un admin verifica el pago después.
  const handleConfirmPayment = async (e) => {
    e.preventDefault()
    setPlacing(true)
    setError('')
    try {
      const order = await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: items.map(({ product, size, quantity }) => ({
          productId: product.id,
          name: product.name,
          price: product.price,
          size,
          quantity,
        })),
        shipping: shippingInfo,
        subtotal,
        shippingCost,
        total,
        payment: {
          method: 'sinpe',
          senderPhone: payment.senderPhone,
          reference: payment.reference,
          receiptImage: receiptData,
        },
        status: 'pendiente',
        createdAt: serverTimestamp(),
      })
      clearCart()
      setOrderId(order.id)
      setStep('confirmation')
    } catch (err) {
      setError(err.message)
    } finally {
      setPlacing(false)
    }
  }

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="checkout-page">
        <CheckoutHeader onCancel={onNavigate} />
        <div className="checkout-empty">
          <p>Tu carrito está vacío.</p>
          <button type="button" onClick={() => onNavigate?.()}>Ir a Comprar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <CheckoutHeader onCancel={onNavigate} />

      {step !== 'confirmation' && (
        <nav className="checkout-steps">
          {STEPS.map((s) => (
            <span key={s.id} className={s.id === step ? 'active' : ''}>{s.label}</span>
          ))}
        </nav>
      )}

      {step === 'confirmation' ? (
        <div className="checkout-confirmation">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>¡Pedido Recibido!</h1>
          <p>Número de pedido: <strong>{orderId}</strong></p>
          <p className="checkout-confirmation-hint">
            Verificaremos tu pago por SINPE Móvil y actualizaremos el estado de tu pedido. Puedes darle
            seguimiento en la sección "Historial de Pedidos" de tu perfil.
          </p>
          <button type="button" onClick={() => onNavigate?.()}>Volver a la Tienda</button>
        </div>
      ) : (
        <div className="checkout-layout">
          <div className="checkout-main">
            {step === 'shipping' && (
              <form className="checkout-form" onSubmit={handleShippingSubmit}>
                <button type="button" className="checkout-step-back" onClick={() => onCartClick?.()}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Volver al Carrito
                </button>
                <h2>Datos de Envío</h2>

                <div className="checkout-row">
                  <div>
                    <label htmlFor="co-name">Nombre Completo</label>
                    <input
                      id="co-name"
                      type="text"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo((s) => ({ ...s, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="co-phone">Teléfono</label>
                    <input
                      id="co-phone"
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="+506 0000 0000"
                      required
                    />
                  </div>
                </div>

                <div className="checkout-row">
                  <div>
                    <label htmlFor="co-province">Provincia</label>
                    <select
                      id="co-province"
                      value={shippingInfo.province}
                      onChange={(e) => setShippingInfo((s) => ({ ...s, province: e.target.value }))}
                      required
                    >
                      <option value="">Selecciona una provincia</option>
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="co-canton">Cantón</label>
                    <input
                      id="co-canton"
                      type="text"
                      value={shippingInfo.canton}
                      onChange={(e) => setShippingInfo((s) => ({ ...s, canton: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <label htmlFor="co-district">Distrito</label>
                <input
                  id="co-district"
                  type="text"
                  value={shippingInfo.district}
                  onChange={(e) => setShippingInfo((s) => ({ ...s, district: e.target.value }))}
                  required
                />

                <label htmlFor="co-details">Señas / Dirección Exacta</label>
                <textarea
                  id="co-details"
                  rows="3"
                  value={shippingInfo.details}
                  onChange={(e) => setShippingInfo((s) => ({ ...s, details: e.target.value }))}
                  placeholder="Ej. 200 metros norte de la iglesia católica, casa color celeste"
                  required
                />

                <label htmlFor="co-postal">Código Postal (opcional)</label>
                <input
                  id="co-postal"
                  type="text"
                  value={shippingInfo.postalCode}
                  onChange={(e) => setShippingInfo((s) => ({ ...s, postalCode: e.target.value }))}
                />

                <button type="submit" className="checkout-submit">Continuar a Resumen</button>
              </form>
            )}

            {step === 'summary' && (
              <div className="checkout-form">
                <button type="button" className="checkout-step-back" onClick={() => setStep('shipping')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Volver a Envío
                </button>
                <h2>Resumen del Pedido</h2>

                <div className="checkout-summary-items">
                  {items.map(({ product, size, quantity }) => (
                    <div className="checkout-summary-item" key={`${product.id}-${size || 'unico'}`}>
                      <CheckoutImage image={getCoverImage(product)} />
                      <div>
                        <span className="checkout-summary-item-name">{product.name}</span>
                        <span className="checkout-summary-item-variant">Talla: {size || 'Único'} · Cant: {quantity}</span>
                      </div>
                      <span>${(product.price * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="checkout-shipping-review">
                  <div className="checkout-shipping-review-header">
                    <h3>Dirección de Envío</h3>
                    <button type="button" onClick={() => setStep('shipping')}>Editar</button>
                  </div>
                  <p>{shippingInfo.fullName} · {shippingInfo.phone}</p>
                  <p>{shippingInfo.details}</p>
                  <p>{shippingInfo.district}, {shippingInfo.canton}, {shippingInfo.province}</p>
                  {shippingInfo.postalCode && <p>Código Postal: {shippingInfo.postalCode}</p>}
                </div>

                <button type="button" className="checkout-submit" onClick={() => setStep('payment')}>
                  Continuar a Pago
                </button>
              </div>
            )}

            {step === 'payment' && (
              <form className="checkout-form" onSubmit={handleConfirmPayment}>
                <button type="button" className="checkout-step-back" onClick={() => setStep('summary')}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Volver a Resumen
                </button>
                <h2>Pago por SINPE Móvil</h2>

                <div className="checkout-sinpe-box">
                  <p>Realiza la transferencia por SINPE Móvil a:</p>
                  <div className="checkout-sinpe-number">{sinpe.sinpeNumber}</div>
                  <p className="checkout-sinpe-name">A nombre de {sinpe.sinpeName}</p>
                  <p className="checkout-sinpe-amount">Monto a transferir: ${total.toFixed(2)}</p>
                </div>

                <p className="checkout-form-hint">
                  Una vez hecha la transferencia, completa estos datos para que podamos confirmar tu pago.
                </p>

                <label htmlFor="co-sender-phone">Número desde el que enviaste el SINPE</label>
                <input
                  id="co-sender-phone"
                  type="tel"
                  placeholder="+506 0000 0000"
                  value={payment.senderPhone}
                  onChange={(e) => setPayment((p) => ({ ...p, senderPhone: e.target.value }))}
                  required
                />

                <label htmlFor="co-reference">Número de Comprobante / Referencia</label>
                <input
                  id="co-reference"
                  type="text"
                  value={payment.reference}
                  onChange={(e) => setPayment((p) => ({ ...p, reference: e.target.value }))}
                  required
                />

                <label htmlFor="co-receipt">Foto del Comprobante</label>
                <input id="co-receipt" type="file" accept="image/*" onChange={handleReceiptChange} required />
                {compressing && <p className="checkout-form-hint">Procesando imagen…</p>}
                {receiptData && (
                  <img className="checkout-receipt-preview" src={receiptData} alt="Vista previa del comprobante" />
                )}

                {error && <p className="checkout-error">{error}</p>}

                <button type="submit" className="checkout-submit" disabled={placing || compressing || !receiptData}>
                  {placing ? 'Confirmando…' : 'Confirmar Pedido'}
                </button>
              </form>
            )}
          </div>

          <aside className="checkout-summary">
            <h2>Resumen del Pedido</h2>
            {items.map(({ product, size, quantity }) => (
              <div className="checkout-summary-row-item" key={`${product.id}-${size || 'unico'}`}>
                <CheckoutImage image={getCoverImage(product)} />
                <div>
                  <span className="checkout-summary-item-name">{product.name}</span>
                  <span className="checkout-summary-item-variant">Talla: {size || 'Único'} × {quantity}</span>
                </div>
                <span>${(product.price * quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-summary-divider" />
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Envío</span>
              <span>{shippingCost === 0 ? 'Gratis' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="checkout-summary-row checkout-summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

// Header minimalista solo para el checkout. Clic en la marca cancela todo el flujo.
function CheckoutHeader({ onCancel }) {
  return (
    <header className="checkout-header">
      <button type="button" className="checkout-brand" onClick={() => onCancel?.()}>NIVORA</button>
      <span className="checkout-secure">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
        </svg>
        Pago Seguro
      </span>
    </header>
  )
}

export default Checkout
