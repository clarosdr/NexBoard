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
    softwareName: '',
    licenseKey: '',
    purchaseDate: '',
    expiryDate: new Date().toISOString().split('T')[0],
    vendor: '',
    cost: 0,
    maxInstallations: 1,
    currentInstallations: 0,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (license) {
      setFormData({
        softwareName: license.softwareName || '',
        licenseKey: license.licenseKey || '',
        purchaseDate: license.purchaseDate || '',
        expiryDate: license.expiryDate || new Date().toISOString().split('T')[0],
        vendor: license.vendor || '',
        cost: license.cost || 0,
        maxInstallations: license.maxInstallations || 1,
        currentInstallations: license.currentInstallations || 0,
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

    if (!formData.softwareName.trim()) {
      alert('El nombre de la licencia es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const licenseData = {
        ...formData,
        id: license ? license.id : generateUUID()
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
          <label htmlFor="softwareName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la licencia *
          </label>
          <input
            type="text"
            id="softwareName"
            name="softwareName"
            placeholder="Ej: Microsoft Office, Adobe Creative Suite"
            value={formData.softwareName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Clave de licencia *
          </label>
          <input
            type="text"
            id="licenseKey"
            name="licenseKey"
            placeholder="Ingrese la clave de licencia"
            value={formData.licenseKey}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de compra
            </label>
            <input
              type="date"
              id="purchaseDate"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de expiración *
            </label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              id="vendor"
              name="vendor"
              placeholder="Ej: Microsoft, Adobe"
              value={formData.vendor}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Costo
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              placeholder="0.00"
              value={formData.cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxInstallations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instalaciones máximas
            </label>
            <input
              type="number"
              id="maxInstallations"
              name="maxInstallations"
              value={formData.maxInstallations}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="currentInstallations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instalaciones actuales
            </label>
            <input
              type="number"
              id="currentInstallations"
              name="currentInstallations"
              value={formData.currentInstallations}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
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
