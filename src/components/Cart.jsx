import { useCart } from '../context/useCart'
import { FREE_SHIPPING_THRESHOLD, calculateShipping } from '../data/shipping'
import { getCoverImage } from '../utils/productImage'
import Header from './Header'
import Footer from './Footer'
import './Cart.css'

// Página del carrito: muestra los productos del usuario (Firestore carts/{uid} vía useCart),
// controles de cantidad, resumen del pedido y botón para ir a Checkout.

// Miniatura del producto en el carrito; muestra un ícono genérico si no hay imagen.
function CartImage({ image }) {
  return (
    <div className="cart-item-image">
      {image ? (
        <img src={image} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M9 4a3 3 0 006 0M12 4l-8 5 2 3 6-3.5L18 12l2-3-8-5zM6 8.5L4 20h16l-2-11.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// Componente del carrito.
function Cart({ onNavigate, onSelectDepartment, onProfileClick, onSelectProduct, onCheckout }) {
  const { items, loading, updateQuantity, removeItem, subtotal } = useCart()

  // El envío se estima aquí; Checkout.jsx recalcula el valor final igual.
  const shipping = calculateShipping(subtotal)
  const total = subtotal + shipping

  return (
    <div className="cart-page">
      <Header onNavigate={onNavigate} onSelectDepartment={onSelectDepartment} onProfileClick={onProfileClick} onSelectProduct={onSelectProduct} />

      <div className="cart-content">
        <h1>Tu Carrito</h1>
        <p className="cart-subtitle">Revisa tus selecciones antes de finalizar la compra.</p>

        {loading && <p className="cart-state">Cargando carrito…</p>}

        {!loading && items.length === 0 && (
          <div className="cart-empty">
            <p>Tu carrito está vacío.</p>
            <button type="button" className="cart-continue-cta" onClick={() => onNavigate?.()}>
              Ir a Comprar
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(({ product, size, quantity }) => (
                <div className="cart-item" key={`${product.id}-${size || 'unico'}`}>
                  <CartImage image={getCoverImage(product)} />
                  <div className="cart-item-info">
                    <span className="cart-item-name">{product.name}</span>
                    <span className="cart-item-variant">
                      {product.composition?.[0] ? `${product.composition[0]} · ` : ''}
                      Talla: {size || 'Único'}
                    </span>
                  </div>
                  <div className="cart-item-quantity">
                    <button
                      type="button"
                      aria-label="Disminuir cantidad"
                      onClick={() => updateQuantity(product.id, size, quantity - 1)}
                    >
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      type="button"
                      aria-label="Aumentar cantidad"
                      onClick={() => updateQuantity(product.id, size, quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="cart-item-price">${(product.price * quantity).toFixed(2)}</span>
                  <button
                    type="button"
                    className="cart-item-remove"
                    aria-label="Eliminar del carrito"
                    onClick={() => removeItem(product.id, size)}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m3 0l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}

              <button type="button" className="cart-continue" onClick={() => onNavigate?.()}>
                ‹ Seguir Comprando
              </button>
            </div>

            <aside className="cart-summary">
              <h2>Resumen del Pedido</h2>
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Envío Estimado</span>
                <span>{shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="cart-summary-row">
                <span>Impuestos</span>
                <span>Se calculan al finalizar</span>
              </div>
              <div className="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button type="button" className="cart-checkout" onClick={() => onCheckout?.()}>
                Proceder al Pago
              </button>

              <p className="cart-trust">Envío gratis en compras mayores a ${FREE_SHIPPING_THRESHOLD.toLocaleString('es')}.</p>
              <p className="cart-trust">Pago seguro y encriptado, procesado por NIVORA Pay.</p>
            </aside>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Cart
