import { useState, useEffect } from 'react'
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



export default function ServiceOrderForm({ order, onSubmit, onCancel, onFormChange }) {
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
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: getTodayLocalDate(),
    method: 'efectivo'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [initialFormData, setInitialFormData] = useState(null)
  const [UNSAVED_CHANGES, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    let initialData;
    if (order) {
      const payments = order.payments || []
      const calculatedTotalPaid = payments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0
        return sum + amount
      }, 0)
      initialData = {
        customer_name: order.customer_name || '',
        description: order.description || '',
        service_date: order.service_date || getTodayLocalDate(),
        status: order.status || 'PENDIENTE',
        items: order.items && order.items.length > 0
          ? order.items.map(item => ({ ...item }))
          : [{ id: 1, description: '', quantity: 1, unitPrice: '', partCost: '' }],
        payments: payments.map(payment => ({ ...payment })),
        totalPaid: calculatedTotalPaid
      }
    } else {
      initialData = {
        customer_name: '',
        description: '',
        service_date: getTodayLocalDate(),
        status: 'PENDIENTE',
        items: [{ id: 1, description: '', quantity: 1, unitPrice: '', partCost: '' }],
        payments: [],
        totalPaid: 0
      }
    }
    setFormData(initialData)
    setInitialFormData(JSON.parse(JSON.stringify(initialData)))
    setIsSubmitting(false)
    setHasUnsavedChanges(false)
  }, [order])

  // Detectar cambios en el formulario
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData)
      setHasUnsavedChanges(hasChanges)
      if (onFormChange) {
        onFormChange(hasChanges)
      }
    }
  }, [formData, initialFormData, onFormChange])

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
    return formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unitPrice) || 0
      return total + (quantity * unitPrice)
    }, 0)
  }

  const calculateTotalPartCost = () => {
    return formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0
      const partCost = Number(item.partCost) || 0
      return total + (quantity * partCost)
    }, 0)
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
    
    // Validación básica
    if (!formData.customer_name.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Por favor ingresa la descripción del servicio');
      return;
    }
    
    // Validar que los ítems tengan descripción
    const invalidItems = formData.items.filter(item => !item.description.trim());
    if (invalidItems.length > 0) {
      alert('Todos los ítems deben tener una descripción');
      return;
    }
    
    setIsSubmitting(true);
  
    // Procesar items para asegurar que los valores numéricos sean números
    const processedItems = formData.items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      partCost: Number(item.partCost) || 0
    }));

    // Procesar pagos para asegurar que los valores numéricos sean números
    const processedPayments = formData.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount) || 0
    }));

    const data = {
      customer_name: formData.customer_name,
      service_date: formData.service_date,
      description: formData.description,
      status: formData.status,
      items: processedItems,
      payments: processedPayments,
      totalPaid: formData.totalPaid
    };

    console.log('Datos a enviar:', data);
  
    try {
      if (onSubmit) {
        await onSubmit(data);
        // Resetear el estado de cambios no guardados después del envío exitoso
        setHasUnsavedChanges(false);
        if (onFormChange) {
          onFormChange(false);
        }
        // No mostrar alerta, la confirmación se maneja en el componente padre
      }
    } catch (err) {
      console.error('Error al guardar orden:', err);
      alert(`No se pudo guardar la orden: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id)) + 1
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, description: '', quantity: 1, unitPrice: '', partCost: '' }]
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
          [field]: field === 'description' ? value : (value === '' ? '' : Number(value) || '')
        } : item
      )
    }))
  }

  const addPayment = () => {
    if (!newPayment.amount || Number(newPayment.amount) <= 0) {
      alert('Por favor ingresa un monto válido')
      return
    }
    
    const payment = {
      id: Date.now(),
      amount: Number(newPayment.amount),
      date: newPayment.date,
      method: newPayment.method
    }
    
    setFormData(prev => ({
      ...prev,
      payments: [...prev.payments, payment],
      totalPaid: prev.totalPaid + Number(newPayment.amount)
    }))
    
    // Reset new payment form
    setNewPayment({
      amount: '',
      date: getTodayLocalDate(),
      method: 'efectivo'
    })
    
    // Focus back to amount input
    setTimeout(() => {
      const amountInput = document.querySelector('.new-payment-form input[type="number"]')
      if (amountInput) amountInput.focus()
    }, 100)
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
        p.id === id ? { ...p, [field]: field === 'amount' ? (value === '' ? '' : Number(value) || '') : value } : p
      )
      const totalPaid = updatedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      return { ...prev, payments: updatedPayments, totalPaid }
    })
  }

  const getItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.unitPrice) || 0
    return quantity * unitPrice
  }

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
        {order ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
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
              autoFocus
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

        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            Ítems de Venta
          </h3>
          {/* Cabecera de columnas */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 rounded-md mb-2">
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.target.closest('.grid').querySelector('input[placeholder="$"]');
                        if (nextInput) nextInput.focus();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const nextInput = e.target.closest('.grid').nextElementSibling?.querySelector('input[placeholder="$"]');
                        if (nextInput) nextInput.focus();
                      }
                    }}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Check if this is the last item, if so add a new one
                        const isLastItem = formData.items[formData.items.length - 1].id === item.id;
                        if (isLastItem) {
                          addItem();
                          setTimeout(() => {
                            const newItemDescription = document.querySelector('.space-y-3 > div:last-child input[placeholder="Descripción"]');
                            if (newItemDescription) newItemDescription.focus();
                          }, 100);
                        } else {
                          const nextItemRow = e.target.closest('.grid').parentElement.nextElementSibling;
                          const nextDescription = nextItemRow?.querySelector('input[placeholder="Descripción"]');
                          if (nextDescription) nextDescription.focus();
                        }
                      }
                    }}
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
                      className="flex items-center ml-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button 
              type="button" 
              onClick={addItem} 
              variant="success" 
              size="md"
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Agregar Ítem
            </Button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700 mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            Pagos
          </h3>
          {/* Cabecera de columnas */}
          <div className="hidden md:grid md:grid-cols-12 gap-3 px-2 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-100 dark:bg-gray-700 rounded-md mb-2">
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
                    className="flex items-center ml-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Formulario para nuevo pago */}
          <div className="new-payment-form mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agregar Nuevo Pago</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Monto</label>
                <input
                  type="number"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newPayment.amount && newPayment.date && newPayment.method) {
                        addPayment();
                      } else {
                        const nextInput = e.target.closest('.grid').querySelector('input[type="date"]');
                        if (nextInput) nextInput.focus();
                      }
                    }
                  }}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="$"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fecha</label>
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const methodSelect = e.target.closest('.grid').querySelector('select');
                      if (methodSelect) methodSelect.focus();
                    }
                  }}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Método</label>
                <select
                  value={newPayment.method}
                  onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newPayment.amount && newPayment.date && newPayment.method) {
                        addPayment();
                      }
                    }
                  }}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              <div className="md:col-span-1">
                <Button 
                  type="button" 
                  onClick={addPayment} 
                  variant="success" 
                  size="sm"
                  className="flex items-center w-full"
                  disabled={!newPayment.amount || Number(newPayment.amount) <= 0}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md border border-gray-200 dark:border-gray-700 mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a3 3 0 00-3 3v2H7a1 1 0 000 2h1v1a1 1 0 01-1 1 1 1 0 100 2h6a1 1 0 100-2H9.83c.11-.313.17-.65.17-1v-1h1a1 1 0 100-2h-1V7a1 1 0 112 0 1 1 0 102 0 3 3 0 00-3-3z" clipRule="evenodd" />
            </svg>
            Resumen Financiero
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Venta</p>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(calculateGrandTotal())}</p>
            </div>
            <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Costo Total</p>
              </div>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(calculateTotalPartCost())}</p>
            </div>
            <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Ganancia</p>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(calculateProfit())}</p>
            </div>
            <div className="p-4 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Saldo Pendiente</p>
              </div>
              <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{formatCurrency(calculatePendingBalance())}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <Button 
            type="button" 
            onClick={() => {
              console.log('Cancel button clicked in ServiceOrderForm');
              if (onCancel) {
                console.log('Calling onCancel function');
                onCancel();
              } else {
                console.log('onCancel function is not defined');
              }
            }} 
            variant="secondary"
            size="lg"
            className="px-6"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            loading={isSubmitting} 
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="px-6"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  )
}
