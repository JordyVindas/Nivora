import { useAuth } from '../../context/useAuth'
import './AdminLayout.css'

// Estructura del panel de admin: sidebar (logo, navegación, usuario) más el área
// de contenido principal con la sección activa (pasada como `children` desde Admin.jsx).

// Entradas de navegación del sidebar; el id coincide con las claves de SECTION_VIEWS en Admin.jsx.
const SECTIONS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Productos',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 2h9l3 3v17H6z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
        <path d="M16 6.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M22 20c0-3-2-5.2-4.5-5.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'policies',
    label: 'Políticas',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

// Componente AdminLayout.
function AdminLayout({ active, onSelectSection, onNavigateHome, onProfileClick, children }) {
  const { user, profile } = useAuth()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <button type="button" className="admin-sidebar-brand" onClick={() => onNavigateHome?.()}>
            <span>NIVORA</span>
            <small>Panel de Admin</small>
          </button>

          <nav className="admin-sidebar-nav">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={active === section.id ? 'active' : ''}
                onClick={() => onSelectSection?.(section.id)}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        <button type="button" className="admin-sidebar-user" onClick={() => onProfileClick?.()}>
          {profile?.photoURL ? (
            <img className="admin-sidebar-avatar" src={profile.photoURL} alt="" />
          ) : (
            <span className="admin-sidebar-avatar" aria-hidden="true" />
          )}
          <span>
            <span className="admin-sidebar-name">{profile?.name || user?.email}</span>
            <span className="admin-sidebar-role">Administrador</span>
          </span>
        </button>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  )
}

export default AdminLayout
