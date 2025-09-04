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
    client_name: '',
    license_name: '',
    serial: '',
    install_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    max_installations: 1,
    current_installations: 0,
    sale_price: 0,
    cost_price: 0,
    profit: 0,
    provider: '',
    condition: 'NUEVA'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (license) {
      setFormData({
        client_name: license.client_name || '',
        license_name: license.license_name || '',
        serial: license.serial || '',
        install_date: license.install_date || new Date().toISOString().split('T')[0],
        expiry_date: license.expiry_date || '',
        max_installations: license.max_installations || 1,
        current_installations: license.current_installations || 0,
        sale_price: license.sale_price || 0,
        cost_price: license.cost_price || 0,
        profit: license.profit || 0,
        provider: license.provider || '',
        condition: license.condition || 'NUEVA'
      })
    }
  }, [license])

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    
    // Calcular ganancia automáticamente cuando cambian los precios
    if (name === 'sale_price' || name === 'cost_price') {
      const salePrice = parseFloat(name === 'sale_price' ? value : formData.sale_price) || 0
      const costPrice = parseFloat(name === 'cost_price' ? value : formData.cost_price) || 0
      newFormData.profit = salePrice - costPrice
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.client_name.trim() || !formData.license_name.trim()) {
      alert('El nombre del cliente y el nombre de la licencia son requeridos')
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar payload con nombres de campos de la base de datos
      const payload = {
        client_name: formData.client_name.trim(),
        license_name: formData.license_name.trim(),
        serial: (formData.serial || '').trim(),
        install_date: formData.install_date || null,
        expiry_date: formData.expiry_date || null,
        max_installations: Number(formData.max_installations) || null,
        current_installations: Number(formData.current_installations) || 0,
        sale_price: Number(formData.sale_price) || 0,
        cost_price: Number(formData.cost_price) || 0,
        profit: Number(formData.profit) || (Number(formData.sale_price || 0) - Number(formData.cost_price || 0)) || 0,
        provider: (formData.provider || '').trim(),
        condition: formData.condition || 'NUEVA'
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
          <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cliente *
          </label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            placeholder="Nombre del cliente"
            value={formData.client_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="license_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre de la licencia *
          </label>
          <input
            type="text"
            id="license_name"
            name="license_name"
            placeholder="Ej: Microsoft Office, Adobe Creative Suite"
            value={formData.license_name}
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
            <label htmlFor="install_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de instalación / compra
            </label>
            <input
              type="date"
              id="install_date"
              name="install_date"
              value={formData.install_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de expiración
            </label>
            <input
              type="date"
              id="expiry_date"
              name="expiry_date"
              value={formData.expiry_date}
              onChange={handleChange}
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
            <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Costo
            </label>
            <input
              type="number"
              id="cost_price"
              name="cost_price"
              placeholder="0.00"
              value={formData.cost_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Precio de venta
          </label>
          <input
            type="number"
            id="sale_price"
            name="sale_price"
            placeholder="0.00"
            value={formData.sale_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="max_installations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instalaciones máximas
            </label>
            <input
              type="number"
              id="max_installations"
              name="max_installations"
              value={formData.max_installations}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="current_installations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instalaciones actuales
            </label>
            <input
              type="number"
              id="current_installations"
              name="current_installations"
              value={formData.current_installations}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Condición
          </label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="NUEVA">Nueva</option>
            <option value="USADA">Usada</option>
          </select>
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
