import { useState, useEffect } from 'react'
// import { supabaseService } from '../lib/supabase'
import Button from './ui/Button'
import { getTodayLocalDate } from '../utils/dateUtils'
import { useAuth } from '../hooks/useAuth'

const GENERATE_UUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}



export default function ServiceOrderForm({ order, onSubmit, onCancel }) {
// Remove unused user variable since it's not being used in the component
useAuth() // Call useAuth hook but don't destructure since we're not using any values
  const [formData, setFormData] = useState({
    customer_name: '',
    description: '',
    service_date: getTodayLocalDate(),
    status: 'PENDIENTE',
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
        customer_name: order.customer_name || '',
        description: order.description || '',
        service_date: order.service_date || getTodayLocalDate(),
        status: order.status || 'PENDIENTE',
        items: order.items && order.items.length > 0
          ? order.items.map(item => ({ ...item }))
          : [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: payments.map(payment => ({ ...payment })),
        totalPaid: calculatedTotalPaid
      })
    } else {
      setFormData({
        customer_name: '',
        description: '',
        service_date: getTodayLocalDate(),
        status: 'PENDIENTE',
        items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: [],
        totalPaid: 0
      })
    }
    setIsSubmitting(false)
  }, [order])

  const statusOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN PROCESO', label: 'En Proceso' },
    { value: 'FINALIZADO', label: 'Finalizado' },
    { value: 'ENTREGADO', label: 'Entregado' }
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
    e.preventDefault();
    setIsSubmitting(true);
  
    const data = {
      customer_name: formData.customer_name,
      service_date: formData.service_date,
      description: formData.description,
      status: formData.status,
      items: formData.items,
      payments: formData.payments,
      totalPaid: formData.totalPaid
    };
  
    try {
      if (onSubmit) await onSubmit(data);
      alert('Orden guardada correctamente ✅');
    } catch (err) {
      console.error('Error al guardar orden:', err);
      alert(`No se pudo guardar la orden: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      date: getTodayLocalDate(),
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
    if (!payment) return
    setFormData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id),
      totalPaid: prev.totalPaid - (Number(payment.amount) || 0)
    }))
  }

  const updatePayment = (id, field, value) => {
    setFormData(prev => {
      const updatedPayments = prev.payments.map(p => 
        p.id === id ? { ...p, [field]: field === 'amount' ? (Number(value) || 0) : value } : p
      )
      const totalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      return { ...prev, payments: updatedPayments, totalPaid }
    })
  }

  const getItemTotal = (item) => {
    return (item.quantity * item.unitPrice) || 0
  }

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
        {order ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Completa la información del servicio, agrega los ítems y registra los pagos realizados.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Cliente *</label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Nombre del cliente"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Servicio</label>
            <input
              type="date"
              name="service_date"
              value={formData.service_date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción del Servicio *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Describe el servicio a realizar"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ítems de Venta</h3>
          {/* Cabecera de columnas */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="md:col-span-5">Descripción</div>
            <div className="md:col-span-2">Cant.</div>
            <div className="md:col-span-2">P. Unitario</div>
            <div className="md:col-span-2">Costo Rep.</div>
            <div className="md:col-span-1 text-right">Total</div>
          </div>
          <div className="space-y-3">
            {formData.items.map((item) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-5">
                  <input
                    type="text"
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="$"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="$"
                    value={item.partCost}
                    onChange={(e) => updateItem(item.id, 'partCost', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-1 text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(getItemTotal(item))}
                </div>
                {formData.items.length > 1 && (
                  <div className="md:col-span-12 text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => removeItem(item.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={addItem} variant="success">+ Agregar Ítem</Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Pagos</h3>
          {/* Cabecera de columnas */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="md:col-span-3">Monto</div>
            <div className="md:col-span-4">Fecha</div>
            <div className="md:col-span-4">Método</div>
            <div className="md:col-span-1 text-right">Acción</div>
          </div>
          <div className="space-y-3">
            {formData.payments.map((payment) => (
              <div key={payment.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-3">
                  <input
                    type="number"
                    min="0"
                    value={payment.amount}
                    onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-4">
                  <input
                    type="date"
                    value={payment.date}
                    onChange={(e) => updatePayment(payment.id, 'date', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div className="md:col-span-4">
                  <select
                    value={payment.method}
                    onChange={(e) => updatePayment(payment.id, 'method', e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>
                <div className="md:col-span-1 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={() => removePayment(payment.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button type="button" onClick={addPayment} variant="success">+ Agregar Pago</Button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Resumen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-md bg-white/60 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculateGrandTotal())}</p>
            </div>
            <div className="p-3 rounded-md bg-white/60 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Costo Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculateTotalPartCost())}</p>
            </div>
            <div className="p-3 rounded-md bg-white/60 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Ganancia</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculateProfit())}</p>
            </div>
            <div className="p-3 rounded-md bg-white/60 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Saldo Pendiente</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(calculatePendingBalance())}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" onClick={onCancel} variant="secondary">Cancelar</Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
