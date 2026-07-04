import { useEffect, useRef, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useStorePolicies } from '../../hooks/useStorePolicies'
import './AdminProducts.css'

// Sección "Políticas": permite editar el documento settings/policies (número SINPE,
// nombre del titular y los textos de envíos/devoluciones y abastecimiento ético).

const EMPTY_SETTINGS = { sinpeNumber: '', sinpeName: '', shipping: '', ethicalSourcing: '' }

// Componente AdminSettings.
function AdminSettings() {
  const { policies, loading } = useStorePolicies()
  const [form, setForm] = useState(EMPTY_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  // Evita que la precarga se repita en cada actualización mientras el admin edita.
  const initialized = useRef(false)

  useEffect(() => {
    if (policies && !initialized.current) {
      setForm({ ...EMPTY_SETTINGS, ...policies })
      initialized.current = true
    }
  }, [policies])

  const updateField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Guarda el formulario en settings/policies (merge para no perder otros campos).
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await setDoc(doc(db, 'settings', 'policies'), form, { merge: true })
      setMessage('Configuración guardada.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-empty">Cargando configuración…</p>
      </div>
    )
  }

  return (
    <div className="admin-content">
      <div className="admin-heading">
        <div>
          <h1>Políticas</h1>
          <p>Configura el pago por SINPE y las políticas de la tienda.</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSave}>
        <h2>Configuración de la Tienda</h2>

        <div className="admin-row">
          <div>
            <label htmlFor="settings-sinpe-number">Número SINPE Móvil</label>
            <input
              id="settings-sinpe-number"
              type="text"
              value={form.sinpeNumber}
              onChange={(e) => updateField('sinpeNumber', e.target.value)}
              placeholder="8888-8888"
              required
            />
          </div>
          <div>
            <label htmlFor="settings-sinpe-name">Nombre del Titular</label>
            <input
              id="settings-sinpe-name"
              type="text"
              value={form.sinpeName}
              onChange={(e) => updateField('sinpeName', e.target.value)}
              required
            />
          </div>
        </div>

        <label htmlFor="settings-shipping">Política de Envíos y Devoluciones</label>
        <textarea id="settings-shipping" rows="3" value={form.shipping} onChange={(e) => updateField('shipping', e.target.value)} />

        <label htmlFor="settings-sourcing">Abastecimiento Ético</label>
        <textarea id="settings-sourcing" rows="3" value={form.ethicalSourcing} onChange={(e) => updateField('ethicalSourcing', e.target.value)} />

        <div className="admin-form-footer">
          <button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar Configuración'}</button>
          {message && <span className="admin-settings-message">{message}</span>}
        </div>
      </form>
    </div>
  )
}

export default AdminSettings
