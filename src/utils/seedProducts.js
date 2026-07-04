// Utilidad de desarrollo/admin para poblar Firestore con productos de ejemplo y políticas por defecto.
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Catálogo de productos de ejemplo, por departamento.
const SAMPLE_PRODUCTS = {
  hombres: [
    {
      name: 'Blazer de Lana Sastre', price: 125.0, status: 'disponible', badge: 'NUEVO', category: 'Abrigos', sizes: ['S', 'M', 'L'],
      description: 'Un blazer de corte sastre con hombros estructurados y solapa clásica, pensado para looks formales sin perder comodidad.',
      composition: ['95% lana virgen, 5% cachemira', 'Forro interior de viscosa', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Pantalón Recto de Lino', price: 85.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Pantalones', sizes: ['XS', 'S'],
      description: 'Pantalón de corte recto en lino ligero, ideal para climas cálidos gracias a su tejido transpirable.',
      composition: ['100% lino europeo', 'Cintura con ajuste interno', 'Lavado a mano en agua fría'],
    },
    {
      name: 'Camisa de Seda Obsidiana', price: 75.0, status: 'disponible', category: 'Camisas', sizes: ['S', 'M', 'L', 'XL'],
      description: 'Camisa de seda en tono obsidiana con caída fluida y botones de nácar, perfecta para ocasiones especiales.',
      composition: ['100% seda natural', 'Botones de nácar genuino', 'Solo limpieza en seco'],
    },
    {
      name: 'Abrigo de Cashmere Camel', price: 320.0, status: 'agotado', category: 'Abrigos', sizes: ['M', 'L'],
      description: 'Abrigo largo en cachemira 100% con silueta envolvente y color camel atemporal.',
      composition: ['100% cachemira', 'Forro de seda', 'Limpieza en seco especializada'],
    },
    {
      name: 'Playera Pima Estructurada', price: 45.0, status: 'disponible', category: 'Camisas', sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Playera de algodón pima con corte estructurado que mantiene su forma lavado tras lavado.',
      composition: ['100% algodón pima peruano', 'Cuello reforzado', 'Lavado a máquina en frío'],
    },
    {
      name: 'Pantalón de Vestir Plisado', price: 110.0, status: 'disponible', category: 'Pantalones', sizes: ['S', 'M', 'L'],
      description: 'Pantalón de vestir con pliegues frontales y caída fluida, corte relajado para uso formal o casual elevado.',
      composition: ['70% lana, 30% poliéster', 'Pretina con ajuste elástico', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Suéter de Cuello Alto', price: 68.0, status: 'disponible', category: 'Camisas', sizes: ['S', 'M', 'L'],
      description: 'Suéter de cuello alto en punto fino, capa versátil para entretiempo con acabado suave al tacto.',
      composition: ['80% lana merino, 20% nylon', 'Cuello doble capa', 'Lavado a mano'],
    },
    {
      name: 'Chaqueta de Mezclilla', price: 95.0, status: 'disponible', category: 'Abrigos', sizes: ['M', 'L', 'XL'],
      description: 'Chaqueta de mezclilla clásica con lavado medio y costuras reforzadas, un básico atemporal.',
      composition: ['100% algodón denim', 'Botones metálicos', 'Lavado a máquina del revés'],
    },
    {
      name: 'Pantalón Cargo Técnico', price: 78.0, status: 'disponible', category: 'Pantalones', sizes: ['S', 'M', 'L', 'XL'],
      description: 'Pantalón cargo con bolsillos utilitarios y tejido técnico resistente al agua ligera.',
      composition: ['65% algodón, 35% nylon técnico', 'Bolsillos con cierre', 'Lavado a máquina en frío'],
    },
    {
      name: 'Camisa a Cuadros Franela', price: 52.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Camisas', sizes: ['S', 'M'],
      description: 'Camisa de franela a cuadros con interior cepillado, cálida y suave para los días fríos.',
      composition: ['100% algodón franela', 'Botones de nácar', 'Lavado a máquina en frío'],
    },
    {
      name: 'Abrigo Trench Impermeable', price: 210.0, status: 'disponible', category: 'Abrigos', sizes: ['M', 'L'],
      description: 'Trench coat impermeable con cinturón ajustable y doble hilera de botones, un clásico renovado.',
      composition: ['65% algodón, 35% poliéster impermeable', 'Cinturón removible', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Pantalón Jogger Elástico', price: 58.0, status: 'disponible', category: 'Pantalones', sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Jogger de tejido elástico con puños ajustados, pensado para máxima comodidad sin sacrificar estilo.',
      composition: ['92% algodón, 8% elastano', 'Cintura y puños elásticos', 'Lavado a máquina en frío'],
    },
    {
      name: 'Camisa Oxford Rayada', price: 60.0, status: 'agotado', category: 'Camisas', sizes: ['S', 'M', 'L'],
      description: 'Camisa Oxford de rayas finas, tejido resistente y corte entallado para uso diario o de oficina.',
      composition: ['100% algodón Oxford', 'Botones tono sobre tono', 'Lavado a máquina en frío'],
    },
    {
      name: 'Chaleco Acolchado', price: 88.0, status: 'disponible', badge: 'NUEVO', category: 'Abrigos', sizes: ['S', 'M', 'L'],
      description: 'Chaleco acolchado ligero con relleno térmico, ideal como capa intermedia en temporada fría.',
      composition: ['Exterior 100% nylon, relleno sintético', 'Cierre frontal con broches', 'Lavado a máquina en frío'],
    },
  ],
  mujeres: [
    {
      name: 'Vestido Midi de Seda', price: 145.0, status: 'disponible', badge: 'NUEVO', category: 'Vestidos', sizes: ['XS', 'S', 'M'],
      description: 'Vestido midi en seda fluida con corte al bies que favorece la silueta, ideal para eventos de noche.',
      composition: ['100% seda', 'Forro interior incluido', 'Solo limpieza en seco'],
    },
    {
      name: 'Blusa de Lino Ecru', price: 65.0, status: 'disponible', category: 'Blusas', sizes: ['S', 'M', 'L'],
      description: 'Blusa de lino en tono ecru con mangas amplias, fresca y ligera para el día a día.',
      composition: ['100% lino', 'Botones de coco natural', 'Lavado a mano en frío'],
    },
    {
      name: 'Falda Plisada Satinada', price: 95.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Faldas', sizes: ['XS', 'S'],
      description: 'Falda plisada en satén con brillo sutil y caída en movimiento, versátil de día o de noche.',
      composition: ['95% poliéster satinado, 5% elastano', 'Cintura con cierre invisible', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Vestido Camisero de Lino', price: 110.0, status: 'disponible', category: 'Vestidos', sizes: ['S', 'M', 'L', 'XL'],
      description: 'Vestido camisero en lino con cinturón a juego, corte relajado perfecto para el verano.',
      composition: ['100% lino', 'Cinturón removible incluido', 'Lavado a máquina en frío'],
    },
    {
      name: 'Blusa de Seda Manga Larga', price: 89.0, status: 'agotado', category: 'Blusas', sizes: ['XS', 'S', 'M'],
      description: 'Blusa de seda de manga larga con cuello anudado, elegante y fluida para looks de oficina o eventos.',
      composition: ['100% seda', 'Cuello con lazo ajustable', 'Solo limpieza en seco'],
    },
    {
      name: 'Falda Recta de Lana', price: 99.0, status: 'disponible', category: 'Faldas', sizes: ['S', 'M', 'L'],
      description: 'Falda recta en lana con forro interior, un básico atemporal para temporada fría.',
      composition: ['80% lana, 20% poliéster', 'Forro interior completo', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Vestido Largo Floral', price: 130.0, status: 'disponible', category: 'Vestidos', sizes: ['S', 'M', 'L'],
      description: 'Vestido largo estampado floral con escote en V y falda amplia, ideal para ocasiones al aire libre.',
      composition: ['100% viscosa', 'Forro interior parcial', 'Lavado a mano en frío'],
    },
    {
      name: 'Blusa Cropped de Algodón', price: 52.0, status: 'disponible', category: 'Blusas', sizes: ['XS', 'S', 'M'],
      description: 'Blusa cropped de algodón con botonadura frontal, pieza versátil para combinar con pantalones de tiro alto.',
      composition: ['100% algodón', 'Botones de nácar', 'Lavado a máquina en frío'],
    },
    {
      name: 'Falda Midi de Denim', price: 72.0, status: 'disponible', category: 'Faldas', sizes: ['S', 'M', 'L'],
      description: 'Falda midi de denim con abertura frontal y costuras visibles, un básico versátil de temporada.',
      composition: ['100% algodón denim', 'Cierre frontal con botones', 'Lavado a máquina del revés'],
    },
    {
      name: 'Vestido Envolvente de Punto', price: 98.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Vestidos', sizes: ['S', 'M'],
      description: 'Vestido envolvente en punto elástico que se ajusta a la silueta, cómodo y favorecedor.',
      composition: ['70% viscosa, 25% poliéster, 5% elastano', 'Ajuste envolvente con nudo lateral', 'Lavado a mano en frío'],
    },
    {
      name: 'Blusa Satinada Escote V', price: 75.0, status: 'disponible', category: 'Blusas', sizes: ['XS', 'S', 'M', 'L'],
      description: 'Blusa satinada con escote en V y caída fluida, un toque de brillo sutil para looks de noche.',
      composition: ['100% poliéster satinado', 'Cierre trasero invisible', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Falda Lápiz Formal', price: 85.0, status: 'agotado', category: 'Faldas', sizes: ['S', 'M', 'L'],
      description: 'Falda lápiz de corte formal con abertura trasera, silueta entallada para looks de oficina.',
      composition: ['68% poliéster, 30% viscosa, 2% elastano', 'Forro interior completo', 'Limpieza en seco recomendada'],
    },
    {
      name: 'Vestido Camisero Rayado', price: 105.0, status: 'disponible', category: 'Vestidos', sizes: ['XS', 'S', 'M', 'L', 'XL'],
      description: 'Vestido camisero de rayas finas con cinturón, corte relajado ideal para uso diario.',
      composition: ['100% algodón', 'Cinturón a juego incluido', 'Lavado a máquina en frío'],
    },
    {
      name: 'Blusa Bordada Artesanal', price: 92.0, status: 'disponible', badge: 'NUEVO', category: 'Blusas', sizes: ['S', 'M'],
      description: 'Blusa con bordado artesanal en el escote, pieza única elaborada por talleres textiles locales.',
      composition: ['100% algodón', 'Bordado hecho a mano', 'Lavado a mano en frío'],
    },
  ],
  accesorios: [
    {
      name: 'Bolso Tote de Cuero', price: 180.0, status: 'disponible', badge: 'NUEVO', category: 'Bolsos', sizes: ['Único'],
      description: 'Bolso tote de cuero genuino con asas reforzadas y espacio interior amplio, pensado para el uso diario.',
      composition: ['100% cuero genuino', 'Forro interior de algodón', 'Limpiar con paño húmedo'],
    },
    {
      name: 'Cinturón de Cuero Clásico', price: 55.0, status: 'disponible', category: 'Cinturones', sizes: ['Único'],
      description: 'Cinturón de cuero liso con hebilla metálica clásica, un básico que combina con todo.',
      composition: ['100% cuero genuino', 'Hebilla de metal niquelado', 'Limpiar con paño seco'],
    },
    {
      name: 'Collar Minimalista de Oro', price: 70.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Joyería', sizes: ['Único'],
      description: 'Collar de cadena fina bañada en oro, diseño minimalista para uso diario o superposición.',
      composition: ['Baño de oro 18k sobre acero', 'Cierre de mosquetón', 'Evitar contacto con agua y perfume'],
    },
    {
      name: 'Bolso Crossbody Camel', price: 135.0, status: 'disponible', category: 'Bolsos', sizes: ['Único'],
      description: 'Bolso crossbody en tono camel con correa ajustable, compacto pero funcional para lo esencial.',
      composition: ['100% cuero genuino', 'Correa ajustable removible', 'Limpiar con paño húmedo'],
    },
    {
      name: 'Cinturón Trenzado', price: 48.0, status: 'agotado', category: 'Cinturones', sizes: ['Único'],
      description: 'Cinturón trenzado en cuero, textura artesanal que aporta un detalle distintivo a cualquier look.',
      composition: ['100% cuero trenzado a mano', 'Hebilla de metal', 'Limpiar con paño seco'],
    },
    {
      name: 'Aretes Geométricos de Plata', price: 40.0, status: 'disponible', category: 'Joyería', sizes: ['Único'],
      description: 'Aretes de formas geométricas en plata 925, ligeros y versátiles para uso diario.',
      composition: ['Plata 925', 'Broche de mariposa', 'Guardar en lugar seco'],
    },
    {
      name: 'Bolso Bandolera Mini', price: 95.0, status: 'disponible', category: 'Bolsos', sizes: ['Único'],
      description: 'Bolso bandolera mini con correa larga ajustable, ideal para llevar lo esencial con estilo.',
      composition: ['100% cuero genuino', 'Correa ajustable', 'Limpiar con paño húmedo'],
    },
    {
      name: 'Cinturón Reversible', price: 60.0, status: 'disponible', category: 'Cinturones', sizes: ['Único'],
      description: 'Cinturón reversible con dos acabados en un solo diseño, práctico y versátil.',
      composition: ['Cuero genuino de dos caras', 'Hebilla giratoria', 'Limpiar con paño seco'],
    },
    {
      name: 'Pulsera de Cuero Trenzado', price: 35.0, status: 'disponible', category: 'Joyería', sizes: ['Único'],
      description: 'Pulsera de cuero trenzado con cierre magnético, un acento sutil de textura natural.',
      composition: ['100% cuero genuino', 'Cierre magnético', 'Evitar contacto prolongado con agua'],
    },
    {
      name: 'Bolso Clutch de Noche', price: 110.0, status: 'limitado', badge: 'STOCK LIMITADO', category: 'Bolsos', sizes: ['Único'],
      description: 'Clutch de noche con acabado satinado y cadena removible, compacto y elegante.',
      composition: ['Exterior satinado, forro de raso', 'Cadena removible incluida', 'Limpiar con paño seco'],
    },
    {
      name: 'Cinturón Ancho de Charol', price: 65.0, status: 'disponible', category: 'Cinturones', sizes: ['Único'],
      description: 'Cinturón ancho de charol con acabado brillante, pieza statement para looks de noche.',
      composition: ['Cuero charol', 'Hebilla metálica pulida', 'Limpiar con paño seco'],
    },
    {
      name: 'Anillo Minimalista de Plata', price: 32.0, status: 'disponible', category: 'Joyería', sizes: ['Único'],
      description: 'Anillo de banda fina en plata 925, diseño minimalista pensado para combinar en capas.',
      composition: ['Plata 925', 'Ajuste estándar', 'Guardar en lugar seco'],
    },
    {
      name: 'Bolso Baguette Textil', price: 88.0, status: 'agotado', category: 'Bolsos', sizes: ['Único'],
      description: 'Bolso baguette en tejido texturizado con correa corta, silueta compacta y actual.',
      composition: ['Exterior textil, forro sintético', 'Correa fija', 'Limpiar con paño húmedo'],
    },
    {
      name: 'Cinturón Doble Hebilla', price: 58.0, status: 'disponible', badge: 'NUEVO', category: 'Cinturones', sizes: ['Único'],
      description: 'Cinturón con doble hebilla metálica, detalle statement para elevar looks básicos.',
      composition: ['100% cuero genuino', 'Doble hebilla metálica', 'Limpiar con paño seco'],
    },
  ],
}

// Texto de políticas de la tienda y datos de SINPE por defecto.
const STORE_POLICIES = {
  shipping:
    'Envío estándar de 3 a 5 días hábiles dentro del país. Envío exprés disponible en 24-48 horas. Devoluciones gratuitas dentro de los 30 días posteriores a la compra, siempre que la prenda conserve sus etiquetas originales y no haya sido usada.',
  ethicalSourcing:
    'Trabajamos con talleres certificados que garantizan condiciones laborales justas. Priorizamos materiales de origen responsable y procesos de producción con menor impacto ambiental en cada colección.',
  sinpeNumber: '8888-8888',
  sinpeName: 'Nivora Costa Rica',
}

// Escribe el catálogo de ejemplo y las políticas por defecto en Firestore.
// Si se indica un departamento, solo siembra ese; si no, siembra todos.
// Las políticas se guardan con merge para no borrar campos ya personalizados.
export async function seedSampleProducts(department) {
  const productsRef = collection(db, 'products')
  const departments = department ? [department] : Object.keys(SAMPLE_PRODUCTS)
  for (const dept of departments) {
    for (const product of SAMPLE_PRODUCTS[dept]) {
      await addDoc(productsRef, { ...product, department: dept, createdAt: serverTimestamp() })
    }
  }
  await setDoc(doc(db, 'settings', 'policies'), STORE_POLICIES, { merge: true })
}
