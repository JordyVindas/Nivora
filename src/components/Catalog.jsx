import { useMemo, useState } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { seedSampleProducts } from '../utils/seedProducts'
import { DEPARTMENTS } from '../data/departments'
import Header from './Header'
import Footer from './Footer'
import ProductCard from './ProductCard'
import './Catalog.css'

// Página de catálogo: listado de productos por departamento, con filtros (categoría,
// talla, precio), orden y paginación en el cliente sobre los productos de useProducts.
// También permite cargar un catálogo de ejemplo si la colección está vacía.

// Cantidad de productos por página en la grilla.
const PAGE_SIZE = 6

// Componente de catálogo.
function Catalog({ initialDepartment, onDepartmentChange, onSelectProduct, onCartClick, onProfileClick }) {
  const { products, loading, error } = useProducts()
  const [department, setDepartment] = useState(initialDepartment || 'hombres')
  const [categories, setCategories] = useState({})
  const [size, setSize] = useState(null)
  const [price, setPrice] = useState(500)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('novedades')
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState('')

  const { label: departmentLabel, heading, sizes: SIZES } = DEPARTMENTS[department]
  const { categories: categoryLists } = useCategories()
  const CATEGORIES = categoryLists[department] || []

  // Carga productos de ejemplo en Firestore (un departamento si se pasa `scope`, o todo el catálogo).
  const handleSeed = async (scope) => {
    setSeeding(true)
    setSeedError('')
    try {
      await seedSampleProducts(scope)
    } catch (err) {
      setSeedError(err.message)
    } finally {
      setSeeding(false)
    }
  }

  const changeDepartment = (dept) => {
    setDepartment(dept)
    onDepartmentChange?.(dept)
    setCategories({})
    setSize(null)
    setPrice(500)
    setPage(1)
  }

  const toggleCategory = (name) => {
    setCategories((prev) => ({ ...prev, [name]: !prev[name] }))
    setPage(1)
  }

  const changeSize = (s) => {
    setSize(s)
    setPage(1)
  }

  const changePrice = (value) => {
    setPrice(value)
    setPage(1)
  }

  const changeSort = (value) => {
    setSortBy(value)
    setPage(1)
  }

  const clearAll = () => {
    setCategories({})
    setSize(null)
    setPrice(500)
    setPage(1)
  }

  // Lista de nombres de categorías actualmente marcadas.
  const activeCategories = Object.keys(categories).filter((c) => categories[c])

  const departmentProducts = useMemo(
    () => products.filter((p) => (p.department || 'hombres') === department),
    [products, department],
  )

  const filteredProducts = useMemo(() => {
    return departmentProducts.filter((p) => {
      if (activeCategories.length && !activeCategories.includes(p.category)) return false
      if (size && Array.isArray(p.sizes) && !p.sizes.includes(size)) return false
      if (typeof p.price === 'number' && p.price > price) return false
      return true
    })
  }, [departmentProducts, activeCategories, size, price])

  const sortedProducts = useMemo(() => {
    if (sortBy === 'precio-asc') return [...filteredProducts].sort((a, b) => a.price - b.price)
    if (sortBy === 'precio-desc') return [...filteredProducts].sort((a, b) => b.price - a.price)
    return filteredProducts
  }, [filteredProducts, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paginatedProducts = sortedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <div className="catalog-page">
      <Header department={department} onSelectDepartment={changeDepartment} onCartClick={onCartClick} onProfileClick={onProfileClick} onSelectProduct={onSelectProduct} showSearch />

      <div className="catalog-body">
        <div className={`catalog-sidebar-wrap ${filtersOpen ? '' : 'closed'}`}>
          <aside className="catalog-sidebar">
            <div className="catalog-sidebar-header">
              <h2>Filtros</h2>
              <button type="button" className="catalog-sidebar-close" onClick={() => setFiltersOpen(false)} aria-label="Cerrar filtros">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <section>
              <h3>Categorías</h3>
              {CATEGORIES.map((cat) => (
                <label key={cat} className="catalog-checkbox">
                  <input
                    type="checkbox"
                    checked={!!categories[cat]}
                    onChange={() => toggleCategory(cat)}
                  />
                  {cat}
                </label>
              ))}
            </section>

            <section>
              <h3>Tallas</h3>
              <div className="catalog-sizes">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={size === s ? 'active' : ''}
                    onClick={() => changeSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3>Rango de Precio</h3>
              <input
                type="range"
                min="75"
                max="500"
                value={price}
                onChange={(e) => changePrice(Number(e.target.value))}
                className="catalog-price-slider"
              />
              <div className="catalog-price-labels">
                <span>$0</span>
                <span>$75 - ${price}</span>
                <span>$500+</span>
              </div>
            </section>

            <button type="button" className="catalog-clear" onClick={clearAll}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Limpiar Todo
            </button>
          </aside>
        </div>

        <main className="catalog-main">
          <div className="catalog-main-header">
            <div className="catalog-main-heading">
              {!filtersOpen && (
                <button type="button" className="catalog-filter-toggle" onClick={() => setFiltersOpen(true)}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                  </svg>
                  Filtros
                </button>
              )}
              <h1>{heading}</h1>
            </div>
            <label className="catalog-sort">
              ORDENAR POR:
              <select value={sortBy} onChange={(e) => changeSort(e.target.value)}>
                <option value="novedades">Novedades</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
              </select>
            </label>
          </div>

          {loading && <p className="catalog-state">Cargando productos…</p>}
          {error && <p className="catalog-state catalog-state-error">No se pudieron cargar los productos: {error}</p>}
          {!loading && !error && products.length === 0 && (
            <div className="catalog-state">
              <p>Todavía no hay productos en la base de datos.</p>
              <button type="button" className="catalog-seed" onClick={() => handleSeed()} disabled={seeding}>
                {seeding ? 'Cargando…' : 'Cargar catálogo de ejemplo completo'}
              </button>
              {seedError && <p className="catalog-state-error">{seedError}</p>}
            </div>
          )}
          {!loading && !error && products.length > 0 && departmentProducts.length === 0 && (
            <div className="catalog-state">
              <p>Todavía no hay productos en {departmentLabel.toLowerCase()}.</p>
              <button type="button" className="catalog-seed" onClick={() => handleSeed(department)} disabled={seeding}>
                {seeding ? 'Cargando…' : `Cargar ejemplos de ${departmentLabel.toLowerCase()}`}
              </button>
              {seedError && <p className="catalog-state-error">{seedError}</p>}
            </div>
          )}
          {!loading && !error && departmentProducts.length > 0 && filteredProducts.length === 0 && (
            <p className="catalog-state">No hay productos que coincidan con los filtros.</p>
          )}

          <div className="catalog-grid">
            {paginatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onClick={onSelectProduct} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="catalog-pagination">
              <button type="button" aria-label="Página anterior" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={currentPage === n ? 'active' : ''}
                  onClick={() => setPage(n)}
                >
                  {String(n).padStart(2, '0')}
                </button>
              ))}
              <button type="button" aria-label="Página siguiente" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                ›
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}

export default Catalog
