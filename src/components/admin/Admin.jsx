import { useState } from 'react'
import AdminLayout from './AdminLayout'
import AdminDashboard from './AdminDashboard'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'
import AdminCustomers from './AdminCustomers'
import AdminSettings from './AdminSettings'

// Enrutador del panel de admin: muestra AdminLayout con la sección activa como contenido.
// No usa librería de router, el cambio de sección es solo estado local.

// Mapea cada id de sección del sidebar al componente que la renderiza.
const SECTION_VIEWS = {
  dashboard: AdminDashboard,
  products: AdminProducts,
  orders: AdminOrders,
  customers: AdminCustomers,
  policies: AdminSettings,
}

// Componente Admin.
function Admin({ onNavigate, onProfileClick }) {
  const [section, setSection] = useState('dashboard')
  const ActiveSection = SECTION_VIEWS[section]

  return (
    <AdminLayout active={section} onSelectSection={setSection} onNavigateHome={onNavigate} onProfileClick={onProfileClick}>
      <ActiveSection />
    </AdminLayout>
  )
}

export default Admin
