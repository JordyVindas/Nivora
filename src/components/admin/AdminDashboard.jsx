import { useMemo, useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useAllOrders } from '../../hooks/useAllOrders'
import { exportOrdersCsv, exportOrdersPdf, exportOrdersWord } from '../../utils/exportOrders'
import { STATUS_LABEL } from '../../data/orderStatus'
import './AdminDashboard.css'

// Página principal del admin: estadísticas (ingresos, pendientes, stock bajo),
// tabla de pedidos recientes y generador de reportes (CSV/PDF/Word) con un
// selector de fecha tipo calendario hecho a mano.

// Opciones del menú "Generar Reporte"; cada `run` exporta con los datos del reporte.
const EXPORT_OPTIONS = [
  { id: 'csv', label: 'CSV', run: exportOrdersCsv },
  { id: 'pdf', label: 'PDF', run: exportOrdersPdf },
  { id: 'word', label: 'Word', run: exportOrdersWord },
]

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const WEEKDAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']

// Formatea año/mes/día como "YYYY-MM-DD".
function toDateString(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Formatea "YYYY-MM-DD" como fecha larga en español ("3 de Julio 2026").
function formatDisplayDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  return `${d} de ${MONTHS[m - 1]} ${y}`
}

function RevenueIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 6v0M18 18v0" strokeLinecap="round" />
    </svg>
  )
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l10 18H2L12 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10v4" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Componente AdminDashboard.
function AdminDashboard() {
  const { products, loading: productsLoading } = useProducts()
  const { orders, loading: ordersLoading } = useAllOrders()
  const [exportOpen, setExportOpen] = useState(false)
  const today = useMemo(() => new Date(), [])
  // `reportDate` es la fecha límite del reporte; `viewYear`/`viewMonth` son el
  // mes que se muestra en el calendario, independiente de la fecha seleccionada.
  const [reportDate, setReportDate] = useState(() => today.toISOString().slice(0, 10))
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Abre el calendario, mostrando el mes/año de la fecha seleccionada.
  const openDatePicker = () => {
    const [y, m] = reportDate.split('-').map(Number)
    setViewYear(y)
    setViewMonth(m - 1)
    setDatePickerOpen(true)
  }

  // Fija la fecha del reporte al día elegido y cierra el calendario.
  const selectDay = (day) => {
    setReportDate(toDateString(viewYear, viewMonth, day))
    setDatePickerOpen(false)
  }

  // Retrocede un mes en el calendario (diciembre del año anterior si es enero).
  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  // Avanza un mes en el calendario; no se puede ir después del mes actual.
  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const isViewingCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay()
  // Rellena con celdas vacías los días antes del 1, para alinear con los encabezados.
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const lowStockProducts = useMemo(() => products.filter((p) => p.status === 'limitado'), [products])

  // Estadísticas en vivo de todo el histórico (independientes de la fecha del reporte).
  // Los pedidos rechazados no cuentan como ingreso porque el pago nunca se cobró.
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== 'rechazado')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    const pendingCount = orders.filter((o) => o.status === 'pendiente').length
    return { totalRevenue, pendingCount, lowStockCount: lowStockProducts.length }
  }, [orders, lowStockProducts])

  // Pedidos incluidos en el reporte: creados hasta las 23:59:59 de reportDate.
  // Los que aún no tienen createdAt resuelto (serverTimestamp pendiente) se incluyen igual.
  const reportOrders = useMemo(() => {
    const cutoff = new Date(`${reportDate}T23:59:59`)
    return orders.filter((o) => !o.createdAt?.toDate || o.createdAt.toDate() <= cutoff)
  }, [orders, reportDate])

  // Igual que `stats`, pero limitado a `reportOrders`; esto es lo que se exporta.
  const reportStats = useMemo(() => {
    const totalRevenue = reportOrders
      .filter((o) => o.status !== 'rechazado')
      .reduce((sum, o) => sum + (o.total || 0), 0)
    const pendingCount = reportOrders.filter((o) => o.status === 'pendiente').length
    return { totalRevenue, pendingCount, lowStockCount: lowStockProducts.length }
  }, [reportOrders, lowStockProducts])

  // Cierra el menú de exportar e invoca la función elegida (CSV/PDF/Word).
  const handleExport = (run) => {
    setExportOpen(false)
    run({ orders: reportOrders, stats: reportStats, lowStockProducts, reportDate })
  }

  const recentOrders = orders.slice(0, 6)
  const loading = productsLoading || ordersLoading

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Resumen</h1>
          <p>Bienvenido de nuevo. Esto es lo que está pasando en Nivora hoy.</p>
        </div>
        <div className="dashboard-toolbar">
          <div className="dashboard-date-picker">
            <button type="button" className="dashboard-date-picker-toggle" onClick={openDatePicker}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
              </svg>
              {formatDisplayDate(reportDate)}
            </button>

            {datePickerOpen && (
              <>
                <div className="dashboard-export-backdrop" onClick={() => setDatePickerOpen(false)} />
                <div className="dashboard-calendar">
                  <div className="dashboard-calendar-nav">
                    <button type="button" onClick={goPrevMonth} aria-label="Mes anterior">‹</button>
                    <span>{MONTHS[viewMonth]} {viewYear}</span>
                    <button type="button" onClick={goNextMonth} disabled={isViewingCurrentMonth} aria-label="Mes siguiente">›</button>
                  </div>
                  <div className="dashboard-calendar-weekdays">
                    {WEEKDAYS.map((wd) => (
                      <span key={wd}>{wd}</span>
                    ))}
                  </div>
                  <div className="dashboard-calendar-grid">
                    {calendarCells.map((day, i) => {
                      if (day === null) return <span key={`blank-${i}`} />
                      const cellDate = toDateString(viewYear, viewMonth, day)
                      const isFuture = cellDate > today.toISOString().slice(0, 10)
                      const isSelected = cellDate === reportDate
                      return (
                        <button
                          key={cellDate}
                          type="button"
                          className={isSelected ? 'active' : ''}
                          disabled={isFuture}
                          onClick={() => selectDay(day)}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="dashboard-export">
            <button
              type="button"
              className="dashboard-export-toggle"
              onClick={() => setExportOpen((v) => !v)}
              disabled={orders.length === 0}
            >
              Generar Reporte
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {exportOpen && (
              <>
                <div className="dashboard-export-backdrop" onClick={() => setExportOpen(false)} />
                <div className="dashboard-export-menu">
                  {EXPORT_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => handleExport(opt.run)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <p className="dashboard-loading">Cargando datos…</p>
      ) : (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-icon"><RevenueIcon /></span>
              </div>
              <span className="dashboard-stat-label">Ingresos Totales</span>
              <span className="dashboard-stat-value">${stats.totalRevenue.toFixed(2)}</span>
            </div>

            <div className="dashboard-stat">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-icon"><OrdersIcon /></span>
              </div>
              <span className="dashboard-stat-label">Pedidos Pendientes</span>
              <span className="dashboard-stat-value">{stats.pendingCount}</span>
            </div>

            <div className="dashboard-stat">
              <div className="dashboard-stat-header">
                <span className="dashboard-stat-icon"><AlertIcon /></span>
                {stats.lowStockCount > 0 && <span className="dashboard-tag">{stats.lowStockCount} artículos</span>}
              </div>
              <span className="dashboard-stat-label">Stock Limitado</span>
              <span className="dashboard-stat-value">{stats.lowStockCount}</span>
            </div>
          </div>

          <div className="dashboard-orders">
            <h2>Pedidos Recientes</h2>
            {recentOrders.length === 0 && <p className="dashboard-empty">Todavía no hay pedidos.</p>}
            {recentOrders.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Estado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id.slice(0, 8).toUpperCase()}</td>
                      <td>{order.shipping?.fullName || '—'}</td>
                      <td>
                        {order.items[0]?.name}
                        {order.items.length > 1 ? ` +${order.items.length - 1} más` : ''}
                      </td>
                      <td>
                        <span className={`dashboard-status status-${order.status}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td>${order.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminDashboard
