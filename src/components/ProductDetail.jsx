import { useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useStorePolicies } from '../hooks/useStorePolicies'
import { useCart } from '../context/useCart'
import Header from './Header'
import Footer from './Footer'
import ProductCard from './ProductCard'
import './ProductDetail.css'

// Página de detalle de producto: galería, precio, stock, descripción, selector de
// talla/cantidad, botón de agregar al carrito, acordeón de políticas y productos complementarios.

const STATUS_LABEL = {
  disponible: 'Disponible',
  limitado: 'Stock Limitado',
  agotado: 'Agotado',
}

// Texto de respaldo cuando el producto no tiene descripción/composición.
const DEFAULT_DESCRIPTION =
  'Una pieza atemporal pensada para durar. Confeccionada con materiales de primera calidad y atención al detalle en cada costura, combina líneas limpias con una silueta pensada para el día a día.'

const DEFAULT_COMPOSITION = [
  'Materiales de primera calidad',
  'Cuidado profesional recomendado',
  'Confeccionado con procesos responsables',
]

// Políticas de respaldo cuando el admin aún no configuró settings/policies.
const DEFAULT_POLICIES = {
  shipping:
    'Envío estándar de 3 a 5 días hábiles. Devoluciones gratuitas dentro de los 30 días posteriores a la compra, siempre que la prenda conserve sus etiquetas originales.',
  ethicalSourcing:
    'Trabajamos con talleres certificados que garantizan condiciones laborales justas y materiales de origen responsable en cada etapa de producción.',
}

// Imagen de respaldo en la galería cuando el producto no tiene fotos; `active` usa el tamaño grande.
function GalleryImage({ active }) {
  return (
    <div className={`detail-image ${active ? '' : 'thumb'}`}>
      <svg viewBox="0 0 24 24" width={active ? 56 : 26} height={active ? 56 : 26} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M9 4a3 3 0 006 0M12 4l-8 5 2 3 6-3.5L18 12l2-3-8-5zM6 8.5L4 20h16l-2-11.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// Muestra una imagen de la galería (foto principal o miniatura).
function GalleryPhoto({ src }) {
  return (
    <div className="detail-image">
      <img src={src} alt="" />
    </div>
  )
}

// Componente de detalle de producto.
function ProductDetail({ product, onNavigate, onSelectDepartment, onSelectProduct, onCartClick, onProfileClick }) {
  const { products } = useProducts()
  const { policies } = useStorePolicies()
  const { addToCart } = useCart()
  const department = product.department || 'hombres'
  const sizes = Array.isArray(product.sizes) ? product.sizes : []
  const galleryImages = product.images?.length ? product.images : product.image ? [product.image] : []

  const activePolicies = policies || DEFAULT_POLICIES
  const accordionSections = [
    { id: 'envios', title: 'Envíos y Devoluciones', content: activePolicies.shipping },
    { id: 'sourcing', title: 'Abastecimiento Ético', content: activePolicies.ethicalSourcing },
  ]

  const [activeThumb, setActiveThumb] = useState(0)
  const [selectedSize, setSelectedSize] = useState(sizes.length === 1 ? sizes[0] : null)
  const [quantity, setQuantity] = useState(1)
  const [sizeError, setSizeError] = useState('')
  const [addedMessage, setAddedMessage] = useState('')
  const [openSection, setOpenSection] = useState('envios')

  // Productos complementarios: mismo departamento, priorizando la misma categoría, máximo 4.
  const complementary = useMemo(() => {
    return products
      .filter((p) => p.id !== product.id && (p.department || 'hombres') === department)
      .sort((a, b) => (a.category === product.category ? -1 : 0) - (b.category === product.category ? -1 : 0))
      .slice(0, 4)
  }, [products, product, department])

  // Valida que haya talla seleccionada y agrega el producto al carrito.
  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      setSizeError('Selecciona una talla antes de continuar.')
      setAddedMessage('')
      return
    }
    setSizeError('')
    addToCart(product, selectedSize, quantity)
    setAddedMessage(`Agregaste ${quantity} × ${product.name}${selectedSize ? ` (talla ${selectedSize})` : ''} al carrito.`)
  }

  return (
    <div className="detail-page">
      <Header department={department} onNavigate={onNavigate} onSelectDepartment={onSelectDepartment} onCartClick={onCartClick} onProfileClick={onProfileClick} onSelectProduct={onSelectProduct} />

      <div className="detail-content">
        <button type="button" className="detail-back" onClick={onNavigate}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </button>

        <div className="detail-main">
          <div className="detail-gallery">
            <div className="detail-image-main">
              {galleryImages.length > 0 ? (
                <GalleryPhoto src={galleryImages[Math.min(activeThumb, galleryImages.length - 1)]} />
              ) : (
                <GalleryImage active />
              )}
            </div>
            {galleryImages.length > 1 && (
              <div className="detail-thumbs">
                {galleryImages.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={`detail-thumb-button ${activeThumb === i ? 'active' : ''}`}
                    onClick={() => setActiveThumb(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                  >
                    <div className="detail-image thumb">
                      <img src={src} alt="" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            {galleryImages.length === 0 && (
              <div className="detail-thumbs">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="detail-thumb-button">
                    <GalleryImage />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="detail-info">
            {product.badge && <span className="detail-badge">{product.badge}</span>}
            <h1>{product.name}</h1>
            <div className="detail-price-row">
              <span className="detail-price">${product.price.toFixed(2)}</span>
              <span className={`product-status status-${product.status}`}>{STATUS_LABEL[product.status]}</span>
            </div>

            <p className="detail-description">{product.description || DEFAULT_DESCRIPTION}</p>

            <ul className="detail-composition">
              {(product.composition || DEFAULT_COMPOSITION).map((line) => (
                <li key={line}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {line}
                </li>
              ))}
            </ul>

            {sizes.length > 0 && (
              <div className="detail-size-block">
                <div className="detail-size-row">
                  <span>Selecciona tu Talla</span>
                </div>
                <div className="detail-sizes">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={selectedSize === s ? 'active' : ''}
                      onClick={() => {
                        setSelectedSize(s)
                        setSizeError('')
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {sizeError && <p className="detail-size-error">{sizeError}</p>}
              </div>
            )}

            <div className="detail-purchase-row">
              <div className="detail-quantity">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Disminuir cantidad">−</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Aumentar cantidad">+</button>
              </div>
              <button type="button" className="detail-add-to-cart" onClick={handleAddToCart} disabled={product.status === 'agotado'}>
                {product.status === 'agotado' ? 'Agotado' : 'Agregar al Carrito'}
              </button>
            </div>

            {addedMessage && <p className="detail-added-message">{addedMessage}</p>}

            <div className="detail-accordion">
              {accordionSections.map((section) => (
                <div key={section.id} className="detail-accordion-item">
                  <button
                    type="button"
                    className="detail-accordion-trigger"
                    onClick={() => setOpenSection((cur) => (cur === section.id ? '' : section.id))}
                  >
                    {section.title}
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className={openSection === section.id ? 'open' : ''}
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  {openSection === section.id && <p className="detail-accordion-content">{section.content}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {complementary.length > 0 && (
          <section className="detail-complementary">
            <div className="detail-complementary-header">
              <div>
                <h2>Piezas Complementarias</h2>
                <p>Elegidas para completar este look.</p>
              </div>
              <button type="button" className="detail-view-collection" onClick={() => onSelectDepartment?.(department)}>
                Ver Colección
              </button>
            </div>
            <div className="detail-complementary-grid">
              {complementary.map((p) => (
                <ProductCard key={p.id} product={p} onClick={onSelectProduct} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ProductDetail
