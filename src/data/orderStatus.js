// Estados posibles de un pedido (orders/{autoId} en Firestore).
// Flujo típico: pendiente -> pagado o rechazado -> enviado -> entregado.

// Etiqueta en español para cada estado del pedido.
export const STATUS_LABEL = {
  pendiente: 'Pendiente SINPE',
  pagado: 'Pagado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
}

// Estados "activos" (todos menos rechazado), usados para filtrar pedidos en curso.
export const ACTIVE_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado']
