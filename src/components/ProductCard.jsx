// Tarjeta de producto en el catálogo: imagen, badge, nombre, estado y precio.
// Al hacer clic navega al detalle del producto.
import { getCoverImage } from '../utils/productImage'
import './ProductCard.css'

// Etiquetas en español para cada estado de producto.
const STATUS_LABEL = {
  disponible: 'Disponible',
  limitado: 'Stock Limitado',
  agotado: 'Agotado',
}

// Imagen de portada del producto con badge opcional, o un ícono si no tiene imagen.
function ProductImage({ image, badge }) {
  return (
    <div className="product-image">
      {badge && <span className="product-badge">{badge}</span>}
      {image ? (
        <img src={image} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M9 4a3 3 0 006 0M12 4l-8 5 2 3 6-3.5L18 12l2-3-8-5zM6 8.5L4 20h16l-2-11.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

// Tarjeta individual de producto en la grilla del catálogo.
function ProductCard({ product, onClick }) {
  return (
    <button type="button" className="product-card" onClick={() => onClick?.(product)}>
      <ProductImage image={getCoverImage(product)} badge={product.badge} />
      <div className="product-info">
        <span className="product-name">{product.name}</span>
        <span className={`product-status status-${product.status}`}>
          {STATUS_LABEL[product.status]}
        </span>
      </div>
      <span className="product-price">${product.price.toFixed(2)}</span>
    </button>
  )
}

export default ProductCard
