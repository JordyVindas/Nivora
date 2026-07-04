// Reportes del dashboard de admin: pedidos + productos con poco stock + resumen,
// exportados en CSV, PDF y Word (comparten los mismos datos, solo cambia el formato).
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS_LABEL = {
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// RGB used for table header backgrounds/title text in the PDF export.
const TABLE_HEADER_COLOR = [8, 6, 13]

// Descarga un blob creando un <a> temporal y liberando la URL después.
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Convierte los pedidos en filas de tabla (id corto, estado en español, total formateado).
function orderRows(orders) {
  return orders.map((o) => [
    `#${o.id.slice(0, 8).toUpperCase()}`,
    o.shipping?.fullName || '',
    o.shipping?.phone || '',
    STATUS_LABEL[o.status] || o.status,
    `$${o.total.toFixed(2)}`,
    o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('es-CR') : '',
  ])
}

// Convierte las estadísticas del dashboard en filas para la tabla "Resumen".
function summaryRows(stats) {
  return [
    ['Ingresos Totales', `$${stats.totalRevenue.toFixed(2)}`],
    ['Pedidos Pendientes', String(stats.pendingCount)],
    ['Productos con Stock Limitado', String(stats.lowStockCount)],
  ]
}

const ORDER_HEADER = ['Pedido', 'Cliente', 'Teléfono', 'Estado', 'Total', 'Fecha']
const STOCK_HEADER = ['Producto', 'Precio']
const SUMMARY_HEADER = ['Métrica', 'Valor']

// Genera y descarga el reporte en CSV (pedidos, stock limitado y resumen).
export function exportOrdersCsv({ orders, stats, lowStockProducts, reportDate }) {
  const lines = []
  lines.push(['Reporte Nivora'])
  lines.push([`Generado el ${new Date().toLocaleDateString('es-CR')} — Corte al ${reportDate}`])
  lines.push([])

  lines.push(['Pedidos'])
  lines.push(ORDER_HEADER)
  lines.push(...orderRows(orders))
  lines.push([])

  if (lowStockProducts.length > 0) {
    lines.push(['Productos con Stock Limitado'])
    lines.push(STOCK_HEADER)
    lowStockProducts.forEach((p) => lines.push([p.name, `$${Number(p.price).toFixed(2)}`]))
    lines.push([])
  }

  lines.push(['Resumen'])
  lines.push(SUMMARY_HEADER)
  lines.push(...summaryRows(stats))

  const csv = lines
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName('csv'))
}

// Dibuja una tabla con título en la posición `y` del PDF y devuelve la
// siguiente posición libre para apilar más secciones.
function addTable(doc, title, y, head, body) {
  doc.setFontSize(12)
  doc.setTextColor(...TABLE_HEADER_COLOR)
  doc.text(title, 14, y)
  autoTable(doc, {
    head: [head],
    body,
    startY: y + 5,
    headStyles: { fillColor: TABLE_HEADER_COLOR },
    styles: { fontSize: 9 },
  })
  return doc.lastAutoTable.finalY + 12
}

// Genera y descarga el mismo reporte en PDF, usando jsPDF + autoTable.
export function exportOrdersPdf({ orders, stats, lowStockProducts, reportDate }) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.setTextColor(...TABLE_HEADER_COLOR)
  doc.text('Nivora — Reporte del Dashboard', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-CR')} — Corte al ${reportDate}`, 14, 25)

  let y = 34
  y = addTable(doc, 'Pedidos', y, ORDER_HEADER, orderRows(orders))

  if (lowStockProducts.length > 0) {
    y = addTable(doc, 'Productos con Stock Limitado', y, STOCK_HEADER, lowStockProducts.map((p) => [p.name, `$${Number(p.price).toFixed(2)}`]))
  }

  addTable(doc, 'Resumen', y, SUMMARY_HEADER, summaryRows(stats))

  doc.save(fileName('pdf'))
}

// Genera una tabla HTML con estilos inline, para el export a Word.
function htmlTable(title, head, rows) {
  const headHtml = head.map((h) => `<th style="padding:6px;border:1px solid #ccc;background:#08060d;color:#fff;">${h}</th>`).join('')
  const bodyHtml = rows
    .map((r) => `<tr>${r.map((cell) => `<td style="padding:6px;border:1px solid #ccc;">${cell}</td>`).join('')}</tr>`)
    .join('')
  return `
    <h3>${title}</h3>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:12px;margin-bottom:20px;">
      <thead><tr>${headHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `
}

// Genera y descarga el reporte como archivo Word: es HTML servido con
// MIME type de Word, que Word abre y muestra como documento normal.
export function exportOrdersWord({ orders, stats, lowStockProducts, reportDate }) {
  const ordersHtml = htmlTable('Pedidos', ORDER_HEADER, orderRows(orders))
  const lowStockHtml =
    lowStockProducts.length > 0
      ? htmlTable('Productos con Stock Limitado', STOCK_HEADER, lowStockProducts.map((p) => [p.name, `$${Number(p.price).toFixed(2)}`]))
      : ''
  const summaryHtml = htmlTable('Resumen', SUMMARY_HEADER, summaryRows(stats))

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>Reporte Nivora</title></head>
    <body style="font-family:sans-serif;">
      <h1>Nivora — Reporte del Dashboard</h1>
      <p>Generado el ${new Date().toLocaleDateString('es-CR')} — Corte al ${reportDate}</p>
      ${ordersHtml}
      ${lowStockHtml}
      ${summaryHtml}
    </body>
    </html>
  `

  downloadBlob(new Blob(['﻿', html], { type: 'application/msword' }), fileName('doc'))
}

// Arma el nombre del archivo con la fecha, ej: reporte-nivora-2026-07-03.<ext>
function fileName(ext) {
  return `reporte-nivora-${new Date().toISOString().slice(0, 10)}.${ext}`
}
