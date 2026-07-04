// Header compartido: marca, navegación por departamento, buscador, carrito
// y avatar del usuario. Algunas secciones se ocultan según la página (showNav/showCart/showSearch).
import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import { useProducts } from '../hooks/useProducts'
import { DEPARTMENTS } from '../data/departments'
import './Header.css'

// Header del sitio: marca, navegación por departamento, buscador, carrito y avatar del usuario.
function Header({ department, onNavigate, onSelectDepartment, onCartClick, onProfileClick, onSelectProduct, showSearch, showNav = true, showCart = true }) {
  const { user, profile } = useAuth()
  const { itemCount } = useCart()
  const { products } = useProducts()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Busca por coincidencia de texto en los productos ya cargados, hasta 8 resultados.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => p.name?.toLowerCase().includes(q)).slice(0, 8)
  }, [products, query])

  const openSearch = () => {
    setSearchOpen(true)
    // Se espera un tick para que el input ya exista en el DOM antes de enfocarlo.
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
  }

  const handleSelectResult = (product) => {
    closeSearch()
    onSelectProduct?.(product)
  }

  return (
    <header className="site-header">
      <button type="button" className="site-brand" onClick={() => onNavigate?.()}>
        NIVORA
      </button>
      <nav className="site-nav">
        {showNav &&
          Object.entries(DEPARTMENTS).map(([key, dept]) => (
            <button
              key={key}
              type="button"
              className={department === key ? 'active' : ''}
              onClick={() => onSelectDepartment?.(key)}
            >
              {dept.label}
            </button>
          ))}
      </nav>
      <div className="site-actions">
        {showSearch && (
          <div className="site-search">
            <button type="button" aria-label="Buscar" onClick={() => (searchOpen ? closeSearch() : openSearch())}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>

            {searchOpen && (
              <div className="site-search-panel">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                  placeholder="Buscar productos…"
                />
                {query.trim() && (
                  <div className="site-search-results">
                    {results.length === 0 && <p className="site-search-empty">No se encontraron productos.</p>}
                    {results.map((p) => (
                      <button key={p.id} type="button" onClick={() => handleSelectResult(p)}>
                        <span className="site-search-result-name">{p.name}</span>
                        <span className="site-search-result-price">${Number(p.price).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searchOpen && <div className="site-search-backdrop" onClick={closeSearch} />}
          </div>
        )}

        {showCart && (
          <button type="button" className="site-cart" aria-label="Carrito" onClick={() => onCartClick?.()}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 4h2l2.4 12.4a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="21" r="1" />
              <circle cx="17" cy="21" r="1" />
            </svg>
            {itemCount > 0 && <span className="site-cart-badge">{itemCount}</span>}
          </button>
        )}
        {user && (
          <button type="button" className="site-user" onClick={() => onProfileClick?.()} title="Ver perfil">
            {profile?.photoURL ? (
              <img className="site-avatar" src={profile.photoURL} alt="" />
            ) : (
              <span className="site-avatar" aria-hidden="true" />
            )}
            <span className="site-user-email">{user.email}</span>
          </button>
        )}
      </div>
    </header>
  )
}

export default Header
