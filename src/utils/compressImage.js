// Comprime imágenes en el navegador (fotos de producto, comprobantes SINPE, perfil).
// No usamos Firebase Storage, así que la imagen se guarda como data URL en Firestore.

// Reduce el ancho de la imagen a maxWidth (sin agrandarla), la convierte a JPEG
// y devuelve el resultado como data URL en Base64 listo para guardar en Firestore.
export function compressImageToDataUrl(file, { maxWidth = 800, quality = 0.6 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
      img.onload = () => {
        // Nunca agranda: el escalado se limita a 1 como máximo.
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
