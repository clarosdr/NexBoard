import React, { useState, useEffect } from 'react'
import Button from './ui/Button'
import { getTodayLocalDate } from '../utils/dateUtils'

export default function BudgetExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    date: getTodayLocalDate(),
    category: 'vivienda',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Categorías fijas solicitadas (solo fijos)
  const categoryOptions = [
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'mi_hija', label: '👧 Mi hija' },
    { value: 'mama', label: '👩 Mamá' },
    { value: 'deudas', label: '💳 Deudas' },
    { value: 'sueldo', label: '💼 Sueldo' },
    { value: 'sueldo_2', label: '💼 Sueldo 2' }
  ]

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: Number(expense.amount) || 0,
        date: expense.date || getTodayLocalDate(),
        category: expense.category || 'vivienda',
        notes: expense.notes || ''
      })
    }
  }, [expense])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }))
  }

  const submitLocal = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.description.trim()) {
      alert('La descripción es requerida')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.({ ...formData })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submitLocal} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción *
          </label>
          <input
            type="text"
            id="description"
            name="description"
            placeholder="Descripción del gasto fijo"
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="0.00"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoría (gasto fijo)
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vencimiento mensual *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detalle
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Detalle del gasto (opcional)"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
          {isSubmitting ? 'Guardando...' : (expense ? 'Actualizar Gasto' : 'Guardar Gasto')}
        </Button>
      </div>
    </form>
  )
}
