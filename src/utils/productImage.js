// Devuelve la imagen de portada de un producto: usa la primera de `images`
// o, si no existe, el campo `image` antiguo (productos creados antes del cambio a array).
export function getCoverImage(product) {
  return product.images?.[0] || product.image || ''
}
