import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function BudgetExpenseForm({ expense, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (expense) {
      setFormData({
        category: expense.category || '',
        amount: Number(expense.amount) || 0,
        date: expense.date || new Date().toISOString().split('T')[0]
      })
    }
  }, [expense])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!formData.category.trim()) {
      alert('La categoría es requerida')
      return
    }

    setIsSubmitting(true)

    try {
      const expenseData = {
        ...formData,
        id: expense ? expense.id : generateUUID(),
        created_at: expense ? expense.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
        amount: Number(formData.amount) || 0
      }

      let error
      if (expense) {
        ({ error } = await supabase
          .from('budget_expenses')
          .update(expenseData)
          .eq('id', expense.id))
      } else {
        ({ error } = await supabase
          .from('budget_expenses')
          .insert([expenseData]))
      }

      if (error) {
        console.error('Error al guardar en Supabase:', error.message)
        alert(`No se pudo guardar el gasto presupuestado: ${error.message}`)
        setIsSubmitting(false)
        return
      }

      alert('Gasto presupuestado guardado correctamente ✅')
      if (onSubmit) onSubmit(expenseData)

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
        name="category"
        placeholder="Categoría"
        value={formData.category}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="amount"
        placeholder="Monto"
        value={formData.amount}
        onChange={handleChange}
        required
      />
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
    </form>
  )
}
