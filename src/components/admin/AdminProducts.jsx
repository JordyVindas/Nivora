import { useState } from 'react'
import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { DEPARTMENTS } from '../../data/departments'
import { compressImageToDataUrl } from '../../utils/compressImage'
import './AdminProducts.css'

// CRUD de productos: tabla con filtro por estado, formulario de alta/edición
// (nombre, colección, categoría, precio, estado, tallas, descripción, composición
// e imágenes comprimidas a Base64), eliminar con confirmación, y un gestor de
// categorías por colección (CategoryManager) que guarda en settings/categories.

const STATUS_LABEL = {
  disponible: 'Disponible',
  limitado: 'Stock Limitado',
  agotado: 'Agotado',
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'Único']
// Igual al límite de imágenes de la galería en ProductDetail.jsx.
const MAX_IMAGES = 4

// Gestiona las categorías por colección (usadas en el filtro del Catálogo y en
// este formulario); lee/escribe settings/categories, un campo por colección.
function CategoryManager({ onClose }) {
  const { categories } = useCategories()
  const [department, setDepartment] = useState('hombres')
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const list = categories[department] || []

  // Guarda la lista de categorías de la colección actual en settings/categories.
  const persist = async (nextList) => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'settings', 'categories'), { [department]: nextList }, { merge: true })
    } finally {
      setSaving(false)
    }
  }

  // Agrega una categoría nueva (sin espacios ni duplicados) a la colección actual.
  const addCategory = async (e) => {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name || list.includes(name)) return
    setNewCategory('')
    await persist([...list, name])
  }

  // Quita una categoría de la colección actual (no afecta productos ya asignados a ella).
  const removeCategory = async (name) => {
    await persist(list.filter((c) => c !== name))
  }

  return (
    <form className="admin-form" onSubmit={addCategory}>
      <h2>Categorías por Colección</h2>

      <label htmlFor="category-department">Colección</label>
      <select id="category-department" value={department} onChange={(e) => setDepartment(e.target.value)}>
        {Object.entries(DEPARTMENTS).map(([key, dept]) => (
          <option key={key} value={key}>{dept.label}</option>
        ))}
      </select>

      <label>Categorías Actuales</label>
      <div className="admin-category-chips">
        {list.length === 0 && <p className="admin-empty">Todavía no hay categorías en esta colección.</p>}
        {list.map((name) => (
          <span className="admin-category-chip" key={name}>
            {name}
            <button type="button" onClick={() => removeCategory(name)} aria-label={`Quitar ${name}`} disabled={saving}>×</button>
          </span>
        ))}
      </div>

      <label htmlFor="category-new">Agregar Categoría</label>
      <div className="admin-composition-row">
        <input
          id="category-new"
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Ej. Trajes de Baño"
        />
        <button type="submit" className="admin-composition-add" disabled={saving || !newCategory.trim()} aria-label="Agregar categoría">
          +
        </button>
      </div>

      <div className="admin-form-footer">
        <button type="button" className="admin-cancel" onClick={onClose}>Volver a Productos</button>
      </div>
    </form>
  )
}

// Estado inicial del formulario para un producto nuevo.
const EMPTY_FORM = {
  name: '',
  department: 'hombres',
  category: '',
  price: '',
  status: 'disponible',
  badge: '',
  sizes: [],
  description: '',
  composition: [''],
  images: [],
}

// Convierte un producto de Firestore en valores del formulario de edición.
function toFormValues(product) {
  return {
    name: product.name || '',
    department: product.department || 'hombres',
    category: product.category || '',
    price: String(product.price ?? ''),
    status: product.status || 'disponible',
    badge: product.badge || '',
    sizes: product.sizes || [],
    description: product.description || '',
    composition: product.composition?.length ? product.composition : [''],
    images: product.images || (product.image ? [product.image] : []),
  }
}

// Componente AdminProducts.
function AdminProducts() {
  const { products, loading } = useProducts()
  const { categories } = useCategories()
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [imageProcessing, setImageProcessing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [managingCategories, setManagingCategories] = useState(false)

  const filteredProducts = statusFilter === 'todos' ? products : products.filter((p) => p.status === statusFilter)

  // Abre el formulario vacío para un producto nuevo (editingId = 'new' marca modo creación).
  const startCreate = () => {
    setEditingId('new')
    setForm({ ...EMPTY_FORM, category: categories.hombres?.[0] || '' })
    setError('')
  }

  // Abre el formulario con los valores actuales del producto a editar.
  const startEdit = (product) => {
    setEditingId(product.id)
    setForm(toFormValues(product))
    setError('')
  }

  // Cierra el formulario y descarta los cambios sin guardar.
  const cancelEdit = () => {
    setEditingId(null)
    setForm(null)
    setError('')
  }

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Al cambiar de colección, reinicia la categoría a la primera de esa colección.
  const changeFormDepartment = (department) => {
    setForm((f) => ({ ...f, department, category: categories[department]?.[0] || '' }))
  }

  // Comprime la foto elegida y la guarda en el slot `index` de la galería (0 = principal).
  const handleImageChange = async (e, index) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageProcessing(true)
    setError('')
    try {
      const dataUrl = await compressImageToDataUrl(file, { maxWidth: 900, quality: 0.7 })
      setForm((f) => {
        const images = [...f.images]
        images[index] = dataUrl
        return { ...f, images }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setImageProcessing(false)
    }
  }

  const removeImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  // Activa o quita una talla de la lista seleccionada.
  const toggleSize = (size) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }))
  }

  const updateCompositionLine = (index, value) => {
    setForm((f) => ({ ...f, composition: f.composition.map((c, i) => (i === index ? value : c)) }))
  }

  const addCompositionLine = () => {
    setForm((f) => ({ ...f, composition: [...f.composition, ''] }))
  }

  const removeCompositionLine = (index) => {
    setForm((f) => ({ ...f, composition: f.composition.filter((_, i) => i !== index) }))
  }

  // Valida y normaliza el formulario, y crea o actualiza el producto en Firestore
  // según si se está creando (editingId === 'new') o editando.
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        department: form.department,
        category: form.category.trim(),
        price: Number(form.price),
        status: form.status,
        badge: form.badge.trim() || null,
        sizes: form.sizes,
        description: form.description.trim(),
        composition: form.composition.map((s) => s.trim()).filter(Boolean),
        images: form.images.filter(Boolean),
      }
      if (editingId === 'new') {
        await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() })
      } else {
        await updateDoc(doc(db, 'products', editingId), payload)
      }
      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Elimina el producto de Firestore tras la confirmación del admin.
  const confirmDelete = async (product) => {
    setConfirmDeleteId(null)
    await deleteDoc(doc(db, 'products', product.id))
  }

  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <h1>Productos</h1>
          <p>Gestiona los productos del catálogo.</p>
        </div>
        {!editingId && !managingCategories && (
          <div className="admin-toolbar">
            <select
              className="admin-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="todos">Todos los Estados</option>
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button type="button" className="admin-add" onClick={startCreate}>
              + Agregar Producto
            </button>
            <button
              type="button"
              className="admin-categories-toggle"
              onClick={() => setManagingCategories(true)}
              aria-label="Gestionar categorías"
              title="Gestionar categorías"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12.5 3H5a2 2 0 00-2 2v7.5a2 2 0 00.6 1.4l8.5 8.5a2 2 0 002.8 0l6.5-6.5a2 2 0 000-2.8l-8.5-8.5A2 2 0 0012.5 3z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {managingCategories && <CategoryManager onClose={() => setManagingCategories(false)} />}

      {!managingCategories && editingId && (
        <form className="admin-form" onSubmit={handleSave}>
          <h2>{editingId === 'new' ? 'Nuevo Producto' : 'Editar Producto'}</h2>

          <div className="admin-form-layout">
            <div className="admin-form-image">
              <label>Imágenes del Producto (hasta {MAX_IMAGES})</label>
              <label className="admin-image-dropzone">
                {form.images[0] ? (
                  <>
                    <img src={form.images[0]} alt="Vista previa del producto" />
                    <button
                      type="button"
                      className="admin-image-remove-badge"
                      onClick={(e) => {
                        e.preventDefault()
                        removeImage(0)
                      }}
                      aria-label="Quitar imagen principal"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <circle cx="9" cy="10" r="2" />
                    <path d="M21 16l-5.5-5.5L4 21" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 0)} hidden />
              </label>

              <div className="admin-image-thumbs">
                {[1, 2, 3].map((index) => (
                  <label key={index} className="admin-image-thumb">
                    {form.images[index] ? (
                      <>
                        <img src={form.images[index]} alt="" />
                        <button
                          type="button"
                          className="admin-image-remove-badge"
                          onClick={(e) => {
                            e.preventDefault()
                            removeImage(index)
                          }}
                          aria-label="Quitar imagen"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span>+</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, index)}
                      disabled={index > form.images.length}
                      hidden
                    />
                  </label>
                ))}
              </div>
              {imageProcessing && <p className="admin-form-hint">Procesando imagen…</p>}
            </div>

            <div className="admin-form-fields">
              <label htmlFor="admin-name">Nombre</label>
              <input id="admin-name" type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />

              <div className="admin-row">
                <div>
                  <label htmlFor="admin-department">Colección</label>
                  <select
                    id="admin-department"
                    value={form.department}
                    onChange={(e) => changeFormDepartment(e.target.value)}
                  >
                    {Object.entries(DEPARTMENTS).map(([key, dept]) => (
                      <option key={key} value={key}>{dept.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-category">Categoría</label>
                  <select id="admin-category" value={form.category} onChange={(e) => updateField('category', e.target.value)} required>
                    {(categories[form.department] || []).length === 0 && <option value="">Sin categorías</option>}
                    {(categories[form.department] || []).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-row">
                <div>
                  <label htmlFor="admin-price">Precio (USD)</label>
                  <input id="admin-price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => updateField('price', e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="admin-status">Estado</label>
                  <select id="admin-status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                    {Object.entries(STATUS_LABEL).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label htmlFor="admin-badge">Insignia (opcional, ej. NUEVO)</label>
              <input id="admin-badge" type="text" value={form.badge} onChange={(e) => updateField('badge', e.target.value)} />

              <label>Tallas Disponibles</label>
              <div className="admin-sizes">
                {SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={form.sizes.includes(size) ? 'active' : ''}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>

              <label htmlFor="admin-description">Descripción</label>
              <textarea id="admin-description" rows="3" value={form.description} onChange={(e) => updateField('description', e.target.value)} />

              <label>Composición y Cuidado</label>
              {form.composition.map((line, index) => (
                <div className="admin-composition-row" key={index}>
                  <input
                    type="text"
                    value={line}
                    onChange={(e) => updateCompositionLine(index, e.target.value)}
                    placeholder="Ej. 100% algodón"
                  />
                  {index === form.composition.length - 1 ? (
                    <button type="button" className="admin-composition-add" onClick={addCompositionLine} aria-label="Agregar línea">
                      +
                    </button>
                  ) : (
                    <button type="button" className="admin-composition-remove" onClick={() => removeCompositionLine(index)} aria-label="Quitar línea">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-form-footer">
            <button type="button" className="admin-cancel" onClick={cancelEdit}>Cancelar</button>
            <button type="submit" disabled={saving || imageProcessing}>{saving ? 'Guardando…' : 'Guardar Producto'}</button>
          </div>
        </form>
      )}

      {!managingCategories && !editingId && (
        <div className="admin-table">
          {loading && <p className="admin-empty">Cargando productos…</p>}
          {!loading && products.length === 0 && <p className="admin-empty">No hay productos todavía.</p>}
          {!loading && products.length > 0 && filteredProducts.length === 0 && (
            <p className="admin-empty">No hay productos con ese estado.</p>
          )}
          {!loading && filteredProducts.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Colección</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{DEPARTMENTS[p.department || 'hombres']?.label}</td>
                    <td>{p.category}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={`admin-status status-${p.status}`}>{STATUS_LABEL[p.status]}</span>
                    </td>
                    <td className="admin-table-actions">
                      <button type="button" aria-label="Editar" title="Editar" onClick={() => startEdit(p)}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M12 20h9" strokeLinecap="round" />
                          <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <div className="admin-delete-wrap">
                        <button
                          type="button"
                          className="admin-delete"
                          aria-label="Eliminar"
                          title="Eliminar"
                          onClick={() => setConfirmDeleteId(p.id)}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m3 0l-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {confirmDeleteId === p.id && (
                          <>
                            <div className="admin-confirm-backdrop" onClick={() => setConfirmDeleteId(null)} />
                            <div className="admin-confirm-popover">
                              <p>¿Eliminar "{p.name}"?</p>
                              <div className="admin-confirm-actions">
                                <button type="button" onClick={() => setConfirmDeleteId(null)}>Cancelar</button>
                                <button type="button" className="admin-confirm-delete" onClick={() => confirmDelete(p)}>Eliminar</button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminProducts
