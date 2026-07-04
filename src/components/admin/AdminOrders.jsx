import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useAllOrders } from '../../hooks/useAllOrders'
import { STATUS_LABEL } from '../../data/orderStatus'
import './AdminProducts.css'
import './AdminDashboard.css'
import './AdminOrders.css'

// Lista de pedidos con filtro por estado y búsqueda; permite revisar el comprobante
// SINPE y aprobar o rechazar el pago, o avanzar el envío hasta entregado.

// Cantidad de pedidos por página en la tabla.
const PAGE_SIZE = 8

const STATUS_FILTERS = ['todos', 'pendiente', 'pagado', 'enviado', 'entregado', 'rechazado']

// Botón de "siguiente paso" para pedidos ya verificados (pendiente/rechazado
// tienen sus propios botones de verificar/rechazar en la vista de revisión).
const NEXT_STATUS = {
  pagado: { next: 'enviado', label: 'Marcar como Enviado' },
  enviado: { next: 'entregado', label: 'Marcar como Entregado' },
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Componente AdminOrders.
function AdminOrders() {
  const { orders, loading } = useAllOrders()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [reviewingOrder, setReviewingOrder] = useState(null)
  const [expandedReceipt, setExpandedReceipt] = useState('')
  const [updating, setUpdating] = useState(false)

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === 'pendiente').length
    const completed = orders.filter((o) => o.status === 'enviado' || o.status === 'entregado').length
    const revenue = orders.filter((o) => o.status !== 'rechazado').reduce((sum, o) => sum + (o.total || 0), 0)
    return { total, pending, completed, revenue }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (statusFilter !== 'todos' && (o.status || 'pendiente') !== statusFilter) return false
      if (!q) return true
      return o.id.toLowerCase().includes(q) || (o.shipping?.fullName || '').toLowerCase().includes(q)
    })
  }, [orders, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const changeSearch = (value) => {
    setSearch(value)
    setPage(1)
  }

  const changeStatusFilter = (value) => {
    setStatusFilter(value)
    setFilterOpen(false)
    setPage(1)
  }

  // Actualiza el estado del pedido en Firestore y lo refleja de inmediato en la vista.
  const setOrderStatus = async (order, status) => {
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'orders', order.id), { status })
      setReviewingOrder((current) => (current ? { ...current, status } : current))
    } finally {
      setUpdating(false)
    }
  }

  // Elige el texto del botón de acción según el estado del pedido.
  const actionLabel = (order) => {
    if ((order.status || 'pendiente') === 'pendiente') return 'Revisar Pago'
    if (order.status === 'rechazado') return 'Ver Registro'
    return 'Detalles'
  }

  // Formatea la fecha de creación del pedido, o un guion si aún no está lista.
  const formatDate = (order) =>
    order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  if (reviewingOrder) {
    const status = reviewingOrder.status || 'pendiente'
    const nextAction = NEXT_STATUS[status]
    return (
      <div className="admin-content">
        <button type="button" className="orders-back" onClick={() => setReviewingOrder(null)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver a Pedidos
        </button>

        <div className="admin-heading">
          <div>
            <h1>Pedido #{reviewingOrder.id.slice(0, 8).toUpperCase()}</h1>
            <p>{formatDate(reviewingOrder)}</p>
          </div>
          <span className={`orders-status status-${status}`}>{STATUS_LABEL[status] || status}</span>
        </div>

        <div className="orders-review-layout">
          <div className="orders-review-main">
            <section className="orders-review-section">
              <h2>Artículos</h2>
              {reviewingOrder.items.map((item, i) => (
                <div className="orders-review-item" key={i}>
                  <span>{item.quantity} × {item.name}</span>
                  <span className="orders-review-item-meta">Talla: {item.size || 'Único'}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="orders-review-totals">
                <div><span>Subtotal</span><span>${reviewingOrder.subtotal.toFixed(2)}</span></div>
                <div><span>Envío</span><span>{reviewingOrder.shippingCost === 0 ? 'Gratis' : `$${reviewingOrder.shippingCost.toFixed(2)}`}</span></div>
                <div className="orders-review-total"><span>Total</span><span>${reviewingOrder.total.toFixed(2)}</span></div>
              </div>
            </section>

            <section className="orders-review-section">
              <h2>Dirección de Envío</h2>
              <p>{reviewingOrder.shipping?.fullName} · {reviewingOrder.shipping?.phone}</p>
              <p>{reviewingOrder.shipping?.details}</p>
              <p>{reviewingOrder.shipping?.district}, {reviewingOrder.shipping?.canton}, {reviewingOrder.shipping?.province}</p>
            </section>
          </div>

          <aside className="orders-review-payment">
            <h2>Pago por SINPE Móvil</h2>
            <div className="orders-review-payment-row">
              <span>Número de envío</span>
              <span>{reviewingOrder.payment?.senderPhone || '—'}</span>
            </div>
            <div className="orders-review-payment-row">
              <span>Referencia</span>
              <span>{reviewingOrder.payment?.reference || '—'}</span>
            </div>
            {reviewingOrder.payment?.receiptImage ? (
              <img
                className="orders-receipt-thumb"
                src={reviewingOrder.payment.receiptImage}
                alt="Comprobante de pago"
                onClick={() => setExpandedReceipt(reviewingOrder.payment.receiptImage)}
              />
            ) : (
              <p className="admin-empty">Sin comprobante adjunto.</p>
            )}

            <div className="orders-review-actions">
              {status === 'pendiente' && (
                <>
                  <button type="button" className="orders-verify" disabled={updating} onClick={() => setOrderStatus(reviewingOrder, 'pagado')}>
                    Verificar Pago
                  </button>
                  <button type="button" className="orders-reject" disabled={updating} onClick={() => setOrderStatus(reviewingOrder, 'rechazado')}>
                    Rechazar Pago
                  </button>
                </>
              )}
              {nextAction && (
                <button type="button" className="orders-verify" disabled={updating} onClick={() => setOrderStatus(reviewingOrder, nextAction.next)}>
                  {nextAction.label}
                </button>
              )}
            </div>
          </aside>
        </div>

        {expandedReceipt && (
          <div className="orders-receipt-overlay" onClick={() => setExpandedReceipt('')}>
            <img src={expandedReceipt} alt="Comprobante ampliado" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <h1>Pedidos</h1>
          <p>Revisa y procesa las transacciones de tus clientes.</p>
        </div>
        <div className="admin-toolbar">
          <input
            type="text"
            className="orders-search"
            placeholder="Buscar Pedido #"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
          <div className="orders-filter">
            <button type="button" className="orders-filter-toggle" onClick={() => setFilterOpen((v) => !v)} aria-label="Filtrar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
              </svg>
            </button>
            {filterOpen && (
              <>
                <div className="dashboard-export-backdrop" onClick={() => setFilterOpen(false)} />
                <div className="orders-filter-menu">
                  {STATUS_FILTERS.map((s) => (
                    <button key={s} type="button" className={statusFilter === s ? 'active' : ''} onClick={() => changeStatusFilter(s)}>
                      {s === 'todos' ? 'Todos los Estados' : STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-stats orders-stats">
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><OrdersIcon /></span></div>
          <span className="dashboard-stat-label">Total de Pedidos</span>
          <span className="dashboard-stat-value">{stats.total}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><ClockIcon /></span></div>
          <span className="dashboard-stat-label">Pendientes SINPE</span>
          <span className="dashboard-stat-value">{stats.pending}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><CheckIcon /></span></div>
          <span className="dashboard-stat-label">Completados</span>
          <span className="dashboard-stat-value">{stats.completed}</span>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-header"><span className="dashboard-stat-icon"><RevenueIcon /></span></div>
          <span className="dashboard-stat-label">Ingresos</span>
          <span className="dashboard-stat-value">${stats.revenue.toFixed(2)}</span>
        </div>
      </div>

      <div className="dashboard-orders">
        {loading && <p className="admin-empty">Cargando pedidos…</p>}
        {!loading && filteredOrders.length === 0 && <p className="admin-empty">No hay pedidos que coincidan.</p>}
        {!loading && paginatedOrders.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Pedido #</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td>{formatDate(order)}</td>
                    <td>{order.shipping?.fullName || '—'}</td>
                    <td>
                      <span className={`orders-status status-${order.status || 'pendiente'}`}>
                        {STATUS_LABEL[order.status || 'pendiente']}
                      </span>
                    </td>
                    <td>${order.total.toFixed(2)}</td>
                    <td>
                      <button type="button" className="orders-action" onClick={() => setReviewingOrder(order)}>
                        {actionLabel(order)}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="orders-pagination">
              <span>Mostrando {paginatedOrders.length} de {filteredOrders.length} pedidos</span>
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

export default AdminOrders
