import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Button from './ui/Button'

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export default function ServiceOrderForm({ order, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customerName: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pendiente',
    items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
    payments: [],
    totalPaid: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (order) {
      const payments = order.payments || []
      const calculatedTotalPaid = payments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0
        return sum + amount
      }, 0)
      setFormData({
        customerName: order.customerName || '',
        description: order.description || '',
        date: order.date || new Date().toISOString().split('T')[0],
        status: order.status || 'pendiente',
        items: order.items && order.items.length > 0
          ? order.items.map(item => ({ ...item }))
          : [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: payments.map(payment => ({ ...payment })),
        totalPaid: calculatedTotalPaid
      })
    } else {
      setFormData({
        customerName: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: [],
        totalPaid: 0
      })
    }
    setIsSubmitting(false)
  }, [order])

  const statusOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'entregado', label: 'Entregado' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0)
  }

  const calculateTotalPartCost = () => {
    return formData.items.reduce((total, item) => total + (item.quantity * item.partCost), 0)
  }

  const calculateProfit = () => {
    return calculateGrandTotal() - calculateTotalPartCost()
  }

  const calculatePendingBalance = () => {
    const total = calculateGrandTotal()
    const paid = formData.totalPaid
    return Math.max(0, total - paid)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.customerName.trim()) {
      alert('El nombre del cliente es requerido')
      return
    }
    if (!formData.description.trim()) {
      alert('La descripción del servicio es requerida')
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        ...formData,
        id: order ? order.id : generateUUID(),
        created_at: order ? order.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total: calculateGrandTotal(),
        totalPartCost: calculateTotalPartCost(),
        profit: calculateProfit(),
        pendingBalance: calculatePendingBalance(),
        customerName: formData.customerName.trim()
      }

      let error
      if (order) {
        ({ error } = await supabase
          .from('service_orders')
          .update(orderData)
          .eq('id', order.id))
      } else {
        ({ error } = await supabase
          .from('service_orders')
          .insert([orderData]))
      }

      if (error) {
        console.error('Error al guardar en Supabase:', error.message)
        alert(`No se pudo guardar la orden: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      alert('Orden guardada correctamente ✅')
      if (onSubmit) onSubmit(orderData)

    } catch (err) {
      console.error('Error inesperado:', err)
      alert('Ocurrió un error inesperado')
      setIsSubmitting(false)
    }
  }

  const addItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id)) + 1
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, description: '', quantity: 1, unitPrice: 0, partCost: 0 }]
    }))
  }

  const removeItem = (id) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      }))
    }
  }

  const updateItem = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { 
          ...item, 
          [field]: field === 'description' ? value : (Number(value) || 0)
        } : item
      )
    }))
  }

  const addPayment = () => {
    const newPayment = {
      id: Date.now(),
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      method: 'efectivo'
    }
    setFormData(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
      totalPaid: prev.totalPaid
    }))
  }

  const removePayment = (id) => {
    const payment = formData.payments.find(p => p.id === id)
    if (payment) {
      setFormData(prev => ({
        ...prev,
        payments: prev.payments.filter(p => p.id !== id),
        totalPaid: prev.totalPaid - (Number(payment.amount) || 0)
      }))
    }
  }

  const updatePayment = (id, field, value) => {
    const oldPayment = formData.payments.find(p => p.id === id)
    const oldAmount = Number(oldPayment?.amount) || 0
    const newAmount = field === 'amount' ? (Number(value) || 0) : oldAmount
    
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.map(payment => 
        payment.id === id ? { ...payment, [field]: value } : payment
      ),
      totalPaid: field === 'amount' 
        ? prev.totalPaid - oldAmount + newAmount
        : prev.totalPaid
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre del Cliente *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Ingrese el nombre del cliente"
          />
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción del Servicio *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Describa el servicio a realizar"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Estado
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ítems de venta */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ítems de Venta</h3>
          <Button
            type="button"
            onClick={addItem}
            variant="success"
            size="sm"
          >
            + Agregar Ítem
          </Button>
        </div>
        
        <div className="space-y-3">
          {formData.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Descripción del ítem"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Precio Unitario
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Costo Parte
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.partCost}
                  onChange={(e) => updateItem(item.id, 'partCost', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="flex items-end">
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    variant="danger"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de totales */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Resumen</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <div className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(calculateGrandTotal())}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Costo Total:</span>
            <div className="font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(calculateTotalPartCost())}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Ganancia:</span>
            <div className="font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(calculateProfit())}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Saldo Pendiente:</span>
            <div className="font-semibold text-orange-600 dark:text-orange-400">
              {formatCurrency(calculatePendingBalance())}
            </div>
          </div>
        </div>
      </div>

      {/* Pagos */}
      {(formData.status === 'finalizado' || formData.status === 'entregado') && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pagos</h3>
            <Button
              type="button"
              onClick={addPayment}
              variant="primary"
              size="sm"
            >
              + Agregar Pago
            </Button>
          </div>
          
          <div className="space-y-3">
            {formData.payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={payment.date}
                    onChange={(e) => updatePayment(payment.id, 'date', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Método
                  </label>
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(payment.id, 'method', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => removePayment(payment.id)}
                    variant="danger"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-right">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Pagado: </span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(formData.totalPaid)}
            </span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          variant="secondary"
          size="lg"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          variant="primary"
          size="lg"
        >
          {isSubmitting ? 'Guardando...' : (order ? 'Actualizar Orden' : 'Guardar Orden')}
        </Button>
      </div>
    </form>
  )
}
