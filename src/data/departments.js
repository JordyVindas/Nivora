// Catálogo por defecto: departamentos (hombres/mujeres/accesorios) con sus categorías y tallas.
// Se usa solo si el documento settings/categories en Firestore no existe o no está personalizado.
export const DEPARTMENTS = {
  hombres: {
    label: 'Hombres',
    heading: 'Colección de Hombres',
    categories: ['Camisas', 'Pantalones', 'Abrigos'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  mujeres: {
    label: 'Mujeres',
    heading: 'Colección Femenina',
    categories: ['Vestidos', 'Blusas', 'Faldas'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  accesorios: {
    label: 'Accesorios',
    heading: 'Colección de Accesorios',
    categories: ['Bolsos', 'Cinturones', 'Joyería'],
    sizes: ['Único'],
  },
}
