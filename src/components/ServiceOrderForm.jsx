import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase' // ✅ Cliente único de Supabase

// Generar UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Formatear moneda COP
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const ServiceOrderForm = ({ order, onSubmit, onCancel }) => {
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

  // Cargar datos si estamos editando
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

  const handleItemChange = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, [field]: ['quantity', 'unitPrice', 'partCost'].includes(field) ? parseFloat(value) || 0 : value }
          : item
      )
    }))
  }

  const updateTotalPaid = () => {
    setFormData(prev => {
      const total = prev.payments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0
        return sum + amount
      }, 0)
      return { ...prev, totalPaid: total }
    })
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

  // ✅ Guardar en Supabase
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
        createdAt: order ? order.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <input
        type="text"
        name="customerName"
        placeholder="Nombre del cliente"
        value={formData.customerName}
        onChange={handleInputChange}
        required
      />
      <textarea
        name="description"
        placeholder="Descripción del servicio"
        value={formData.description}
        onChange={handleInputChange}
        required
      />
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleInputChange}
        required
      />
      <select
        name="status"
        value={formData.status}
        onChange={handleInputChange}
      >
        {statusOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Aquí iría tu lógica para items, pagos, totales, etc. */}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
    </form>
  )
}

export default ServiceOrderForm
