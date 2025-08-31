import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'

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
    expirationDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (license) {
      setFormData({
        name: license.name || '',
        key: license.key || '',
        expirationDate: license.expirationDate || new Date().toISOString().split('T')[0],
        notes: license.notes || ''
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
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la licencia *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Ej: Microsoft Office, Adobe Creative Suite"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Clave de licencia *
          </label>
          <input
            type="text"
            id="key"
            name="key"
            placeholder="Ingrese la clave de licencia"
            value={formData.key}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>
        
        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha de expiración *
          </label>
          <input
            type="date"
            id="expirationDate"
            name="expirationDate"
            value={formData.expirationDate}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas adicionales
          </label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Información adicional sobre la licencia..."
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-vertical"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            variant="secondary"
            size="lg"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          variant="primary"
          size="lg"
        >
          {isSubmitting ? 'Guardando...' : (license ? 'Actualizar Licencia' : 'Guardar Licencia')}
        </Button>
      </div>
    </form>
  )
}
