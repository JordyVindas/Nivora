// Constantes y cálculo del costo de envío para el carrito/checkout.

// Subtotal (en colones) a partir del cual el envío es gratis.
export const FREE_SHIPPING_THRESHOLD = 2000
// Costo fijo de envío (en colones) cuando no aplica envío gratis.
export const SHIPPING_ESTIMATE = 25

// Calcula el costo de envío según el subtotal: gratis si el carrito está vacío o llega al umbral.
export function calculateShipping(subtotal) {
  return subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_ESTIMATE
}
