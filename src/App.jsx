// Raíz de la app. No usamos librería de router: la navegación es un estado
// `view` ('catalog' | 'product' | 'cart' | 'checkout' | 'profile' | 'admin').
import { useEffect, useRef, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { CartProvider } from './context/CartContext'
import Login from './components/Login'
import Catalog from './components/Catalog'
import ProductDetail from './components/ProductDetail'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import Profile from './components/Profile'
import Admin from './components/admin/Admin'

// Shell autenticado: controla el estado `view` y renderiza la página que
// corresponde, pasando callbacks de navegación a los hijos.
// Al cargar, si el usuario es admin, redirige una sola vez a la vista 'admin'.
function Shop() {
  const { profile, isAdmin } = useAuth()
  const [department, setDepartment] = useState('hombres')
  const [view, setView] = useState('catalog')
  const [selectedProduct, setSelectedProduct] = useState(null)
  // Evita que la redirección a admin se repita cada vez que cambia profile/isAdmin.
  const initialRouteApplied = useRef(false)

  useEffect(() => {
    if (profile && !initialRouteApplied.current) {
      initialRouteApplied.current = true
      setView(isAdmin ? 'admin' : 'catalog')
    }
  }, [profile, isAdmin])

  const goToCatalog = (dept) => {
    if (dept) setDepartment(dept)
    setSelectedProduct(null)
    setView('catalog')
  }

  const goToProduct = (product) => {
    setSelectedProduct(product)
    setView('product')
  }

  const goToCart = () => setView('cart')
  const goToCheckout = () => setView('checkout')
  const goToProfile = () => setView('profile')
  const goToAdmin = () => setView('admin')

  const nav = {
    onNavigate: () => goToCatalog(),
    onSelectDepartment: goToCatalog,
    onCartClick: goToCart,
    onProfileClick: goToProfile,
    onSelectProduct: goToProduct,
  }

  if (view === 'checkout') {
    return <Checkout onNavigate={() => goToCatalog()} onCartClick={goToCart} />
  }

  if (view === 'cart') {
    return <Cart {...nav} onCheckout={goToCheckout} />
  }

  if (view === 'profile') {
    return <Profile {...nav} onAdminClick={goToAdmin} />
  }

  if (view === 'admin') {
    return <Admin onNavigate={() => goToCatalog()} onProfileClick={goToProfile} />
  }

  if (view === 'product' && selectedProduct) {
    return (
      <ProductDetail
        key={selectedProduct.id}
        product={selectedProduct}
        {...nav}
        onSelectProduct={goToProduct}
      />
    )
  }

  return (
    <Catalog
      initialDepartment={department}
      onDepartmentChange={setDepartment}
      onSelectProduct={goToProduct}
      onCartClick={goToCart}
      onProfileClick={goToProfile}
    />
  )
}

// Muestra Login o el Shop autenticado (con CartProvider) según el estado de auth.
function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 80 }}>Cargando…</p>
  }

  return user ? (
    <CartProvider>
      <Shop />
    </CartProvider>
  ) : (
    <Login />
  )
}

// Componente raíz: envuelve la app en AuthProvider para que useAuth() funcione en todos lados.
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
