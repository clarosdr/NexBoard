import React, { useState, useEffect } from 'react'
// Removed direct supabase import since persistence is handled by parent via onSubmit
import Button from './ui/Button'

const _generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function LicenseForm({ license, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    clientName: '',
    licenseName: '',
    serial: '',
    installationDate: '',
    expirationDate: new Date().toISOString().split('T')[0],
    maxInstallations: 1,
    currentInstallations: 0,
    salePrice: 0,
    costPrice: 0,
    profit: 0,
    provider: '',
    condition: 'NUEVA',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (license) {
      setFormData({
        clientName: license.client_name || license.clientName || '',
        licenseName: license.license_name || license.licenseName || '',
        serial: license.serial || license.licenseKey || '',
        installationDate: license.installation_date || license.installationDate || '',
        expirationDate: license.expiration_date || license.expirationDate || new Date().toISOString().split('T')[0],
        maxInstallations: license.max_installations || license.maxInstallations || 1,
        currentInstallations: license.current_installations || license.currentInstallations || 0,
        salePrice: license.sale_price || license.salePrice || 0,
        costPrice: license.cost_price || license.costPrice || 0,
        profit: license.profit || 0,
        provider: license.provider || license.vendor || '',
        condition: license.condition || 'NUEVA',
        notes: license.notes || ''
      })
    }
  }, [license])

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Calcular ganancia automáticamente cuando cambian los precios
    if (name === 'salePrice' || name === 'costPrice') {
      const salePrice = parseFloat(name === 'salePrice' ? value : formData.salePrice) || 0
      const costPrice = parseFloat(name === 'costPrice' ? value : formData.costPrice) || 0
      newFormData.profit = salePrice - costPrice
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.clientName.trim() || !formData.licenseName.trim()) {
      alert('El nombre del cliente y el nombre de la licencia son requeridos')
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar payload en camelCase para el supabaseService (se encarga el padre)
      const payload = {
        clientName: formData.clientName.trim(),
        licenseName: formData.licenseName.trim(),
        serial: (formData.serial || '').trim(),
        installationDate: formData.installationDate || null,
        expirationDate: formData.expirationDate || null,
        maxInstallations: Number(formData.maxInstallations) || null,
        currentInstallations: Number(formData.currentInstallations) || 0,
        salePrice: Number(formData.salePrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        profit: Number(formData.profit) || (Number(formData.salePrice || 0) - Number(formData.costPrice || 0)) || 0,
        provider: (formData.provider || '').trim(),
        condition: formData.condition || '',
        notes: formData.notes || ''
      }

      await onSubmit?.(payload)
    } catch (err) {
      console.error('Error inesperado:', err)
      alert('Ocurrió un error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cliente *
          </label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            placeholder="Nombre del cliente"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="licenseName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la licencia *
          </label>
          <input
            type="text"
            id="licenseName"
            name="licenseName"
            placeholder="Ej: Microsoft Office, Adobe Creative Suite"
            value={formData.licenseName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Serial / Clave de licencia
          </label>
          <input
            type="text"
            id="serial"
            name="serial"
            placeholder="Ingrese el serial o clave de licencia"
            value={formData.serial}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-mono"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de instalación / compra
            </label>
            <input
              type="date"
              id="installationDate"
              name="installationDate"
              value={formData.installationDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Proveedor
            </label>
            <input
              type="text"
              id="provider"
              name="provider"
              placeholder="Ej: Microsoft, Adobe"
              value={formData.provider}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Costo
            </label>
            <input
              type="number"
              id="costPrice"
              name="costPrice"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio de venta
          </label>
          <input
            type="number"
            id="salePrice"
            name="salePrice"
            placeholder="0.00"
            value={formData.salePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Ganancia estimada: {Number(formData.salePrice || 0) - Number(formData.costPrice || 0)}</p>
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
