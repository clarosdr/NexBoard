import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function LicenseForm({ license, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    expirationDate: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (license) {
      setFormData({
        name: license.name || '',
        key: license.key || '',
        expirationDate: license.expirationDate || new Date().toISOString().split('T')[0]
      })
    }
  }, [license])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.name.trim()) {
      alert('El nombre de la licencia es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const licenseData = {
        ...formData,
        id: license ? license.id : generateUUID(),
        created_at: license ? license.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
      }

      let error
      if (license) {
        ({ error } = await supabase
          .from('licenses')
          .update(licenseData)
          .eq('id', license.id))
      } else {
        ({ error } = await supabase
          .from('licenses')
          .insert([licenseData]))
      }

      if (error) {
        console.error('Error al guardar en Supabase:', error.message)
        alert(`No se pudo guardar la licencia: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      alert('Licencia guardada correctamente ✅')
      if (onSubmit) onSubmit(licenseData)

    } catch (err) {
      console.error('Error inesperado:', err)
      alert('Ocurrió un error inesperado')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Nombre de la licencia"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="key"
        placeholder="Clave de la licencia"
        value={formData.key}
        onChange={handleChange}
        required
      />
      <input
        type="date"
        name="expirationDate"
        value={formData.expirationDate}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Licencia'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
    </form>
  )
}
