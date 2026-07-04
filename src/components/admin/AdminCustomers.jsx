import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAuth } from '../../context/useAuth'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useAllOrders } from '../../hooks/useAllOrders'
import { STATUS_LABEL } from '../../data/orderStatus'
import './AdminProducts.css'
import './AdminDashboard.css'
import './AdminOrders.css'
import './AdminCustomers.css'

// Sección "Clientes": lista los usuarios registrados con búsqueda, estadísticas y
// paginación, y permite ver el detalle de cada cliente (pedidos, dirección y rol).

// Cantidad de clientes por página en la tabla.
const PAGE_SIZE = 8

// Genera las iniciales del avatar a partir del nombre (o el correo, o '?').
function initials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// Formatea un Timestamp de Firestore como fecha corta ("3 jul 2026"), o un guion si no hay valor.
function formatDate(value) {
  return value?.toDate ? value.toDate().toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" />
      <path d="M16 6.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M22 20c0-3-2-5.2-4.5-5.9" strokeLinecap="round" />
    </svg>
  )
}

function NewUserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3.1-6 7.5-6s7.5 2.5 7.5 6" strokeLinecap="round" />
      <path d="M19 8v6M16 11h6" strokeLinecap="round" />
    </svg>
  )
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l-1 12H7L6 8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 016 0v2" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Componente AdminCustomers.
function AdminCustomers() {
  const { user: currentUser } = useAuth()
  const { users, loading: usersLoading } = useAllUsers()
  const { orders, loading: ordersLoading } = useAllOrders()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewingUser, setViewingUser] = useState(null)
  const [confirmRoleChange, setConfirmRoleChange] = useState(false)
  const [savingRole, setSavingRole] = useState(false)

  // Agrupa los pedidos por userId para buscar el historial de cada cliente rápido.
  const ordersByUser = useMemo(() => {
    const map = {}
    orders.forEach((o) => {
      map[o.userId] = map[o.userId] || []
      map[o.userId].push(o)
    })
    return map
  }, [orders])

  const stats = useMemo(() => {
    const now = new Date()
    const newThisMonth = users.filter((u) => {
      const created = u.createdAt?.toDate?.()
      return created && created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    }).length
    const withOrders = users.filter((u) => ordersByUser[u.id]?.length > 0).length
    const admins = users.filter((u) => u.role === 'admin').length
    return { total: users.length, newThisMonth, withOrders, admins }
  }, [users, ordersByUser])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  // Cambia el rol del usuario entre 'admin' y 'user' tras la confirmación del admin.
  // No se puede usar sobre la propia cuenta (ver el guard `isSelf` más abajo).
  const toggleRole = async () => {
    if (!viewingUser) return
    setSavingRole(true)
    try {
      const nextRole = viewingUser.role === 'admin' ? 'user' : 'admin'
      await updateDoc(doc(db, 'users', viewingUser.id), { role: nextRole })
      setViewingUser((u) => (u ? { ...u, role: nextRole } : u))
      setConfirmRoleChange(false)
    } finally {
      setSavingRole(false)
    }
  }

  if (viewingUser) {
    const userOrders = ordersByUser[viewingUser.id] || []
    const isSelf = viewingUser.id === currentUser?.uid
    const isAdmin = viewingUser.role === 'admin'

    return (
      <div className="admin-content">
        <button type="button" className="orders-back" onClick={() => setViewingUser(null)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver a Clientes
        </button>

        <div className="admin-heading">
          <div>
            <h1>{viewingUser.name || 'Sin nombre'}</h1>
            <p>{viewingUser.email}</p>
          </div>
          {isAdmin && <span className="customers-role-badge">Administrador</span>}
        </div>

        <div className="orders-review-layout">
          <div className="orders-review-main">
            <section className="orders-review-section">
              <h2>Historial de Pedidos</h2>
              {userOrders.length === 0 && <p className="admin-empty">Este cliente aún no tiene pedidos.</p>}
              {userOrders.map((order) => (
                <div className="orders-review-item" key={order.id}>
                  <span>#{order.id.slice(0, 8).toUpperCase()}</span>
                  <span className="orders-review-item-meta">{formatDate(order.createdAt)}</span>
                  <span className={`orders-status status-${order.status || 'pendiente'}`}>
                    {STATUS_LABEL[order.status || 'pendiente']}
                  </span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              ))}
            </section>

            {viewingUser.address && (
              <section className="orders-review-section">
                <h2>Dirección Guardada</h2>
                <p>{viewingUser.address.phone}</p>
                <p>{viewingUser.address.details}</p>
                <p>{viewingUser.address.district}, {viewingUser.address.canton}, {viewingUser.address.province}</p>
              </section>
            )}
          </div>

          <aside className="orders-review-payment">
            <h2>Cuenta</h2>
            <div className="orders-review-payment-row">
              <span>Cliente desde</span>
              <span>{formatDate(viewingUser.createdAt)}</span>
            </div>
            <div className="orders-review-payment-row">
              <span>Pedidos realizados</span>
              <span>{userOrders.length}</span>
            </div>
            <div className="orders-review-payment-row">
              <span>Rol actual</span>
              <span>{isAdmin ? 'Administrador' : 'Cliente'}</span>
            </div>

            <div className="orders-review-actions">
              {isSelf ? (
                <p className="admin-form-hint">No puedes cambiar tu propio rol desde aquí.</p>
              ) : confirmRoleChange ? (
                <>
                  <p className="admin-form-hint">
                    {isAdmin ? '¿Quitarle el acceso de administrador?' : '¿Darle acceso de administrador?'}
                  </p>
                  <button type="button" className="orders-verify" disabled={savingRole} onClick={toggleRole}>
                    {savingRole ? 'Guardando…' : 'Confirmar'}
                  </button>
                  <button type="button" className="orders-reject" onClick={() => setConfirmRoleChange(false)}>Cancelar</button>
                </>
              ) : (
                <button type="button" className={isAdmin ? 'orders-reject' : 'orders-verify'} onClick={() => setConfirmRoleChange(true)}>
                  {isAdmin ? 'Quitar Administrador' : 'Hacer Administrador'}
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <h1>Clientes</h1>
          <p>Consulta y gestiona los usuarios registrados.</p>
        </div>
        <input
          type="text"
          className="orders-search"
          placeholder="Buscar por nombre o correo…"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
        />
      </div>

      <div className="dashboard-stats orders-stats">
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><PeopleIcon /></span></div>
          <span className="dashboard-stat-label">Total de Clientes</span>
          <span className="dashboard-stat-value">{stats.total}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><NewUserIcon /></span></div>
          <span className="dashboard-stat-label">Nuevos Este Mes</span>
          <span className="dashboard-stat-value">{stats.newThisMonth}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><BagIcon /></span></div>
          <span className="dashboard-stat-label">Con Pedidos</span>
          <span className="dashboard-stat-value">{stats.withOrders}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><ShieldIcon /></span></div>
          <span className="dashboard-stat-label">Administradores</span>
          <span className="dashboard-stat-value">{stats.admins}</span>
        </div>
      </div>

      <div className="dashboard-orders">
        {(usersLoading || ordersLoading) && <p className="admin-empty">Cargando clientes…</p>}
        {!usersLoading && !ordersLoading && filteredUsers.length === 0 && (
          <p className="admin-empty">No se encontraron clientes.</p>
        )}
        {!usersLoading && !ordersLoading && paginatedUsers.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Se unió</th>
                  <th>Pedidos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="customers-name-cell">
                        <span className="customers-avatar">{initials(u.name, u.email)}</span>
                        <div>
                          <span className="customers-name">{u.name || 'Sin nombre'}</span>
                          {u.role === 'admin' && <span className="customers-role-tag">Admin</span>}
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.address?.phone || '—'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>{ordersByUser[u.id]?.length || 0}</td>
                    <td>
                      <button type="button" className="orders-action" onClick={() => setViewingUser(u)}>Ver Detalles</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="orders-pagination">
              <span>Mostrando {paginatedUsers.length} de {filteredUsers.length} clientes</span>
              <div className="orders-pagination-buttons">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Anterior">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" className={currentPage === n ? 'active' : ''} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Siguiente">›</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminCustomers
