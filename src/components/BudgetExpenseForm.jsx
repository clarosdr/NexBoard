import { useState, useEffect } from 'react';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const BudgetExpenseForm = ({ expense, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    frequency: 'monthly', // monthly, weekly, yearly
    dueDate: new Date().toISOString().split('T')[0],
    isPaid: false,
    category: 'general',
    notes: ''
  });

  // Cargar datos del gasto si estamos editando
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        frequency: expense.frequency,
        dueDate: expense.dueDate,
        isPaid: expense.isPaid,
        category: expense.category || 'general',
        notes: expense.notes || ''
      });
    } else {
      // Reset form for new expense
      setFormData({
        description: '',
        amount: 0,
        frequency: 'monthly',
        dueDate: new Date().toISOString().split('T')[0],
        isPaid: false,
        category: 'general',
        notes: ''
      });
    }
  }, [expense]);

  const frequencyOptions = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'housing', label: 'Vivienda' },
    { value: 'utilities', label: 'Servicios Públicos' },
    { value: 'food', label: 'Alimentación' },
    { value: 'transportation', label: 'Transporte' },
    { value: 'healthcare', label: 'Salud' },
    { value: 'entertainment', label: 'Entretenimiento' },
    { value: 'education', label: 'Educación' },
    { value: 'insurance', label: 'Seguros' },
    { value: 'debt', label: 'Deudas' },
    { value: 'savings', label: 'Ahorros' },
    { value: 'other', label: 'Otros' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'amount' ? parseFloat(value) || 0 : value)
    }));
  };

  const calculateNextDueDate = (currentDate, frequency) => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const expenseData = {
      ...formData,
      id: expense?.id || Date.now(),
      createdAt: expense?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nextDueDate: calculateNextDueDate(formData.dueDate, formData.frequency)
    };
    onSubmit(expenseData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {expense ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del Gasto *
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              placeholder="Ej: Arriendo, Servicios públicos, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="1"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              placeholder="0"
            />
            <p className="text-sm text-gray-500 mt-1">
              Valor: {formatCurrency(formData.amount)}
            </p>
          </div>
        </div>

        {/* Frecuencia y categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frecuencia
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            >
              {frequencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha de vencimiento y estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Vencimiento
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
            />
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 touch-manipulation"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Marcado como pagado
              </label>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (Opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none"
            placeholder="Información adicional sobre este gasto..."
          />
        </div>

        {/* Información de próximo vencimiento */}
        {formData.dueDate && (
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Información de Recurrencia</h3>
            <p className="text-sm text-blue-700">
              Próximo vencimiento: {new Date(calculateNextDueDate(formData.dueDate, formData.frequency)).toLocaleDateString('es-CO')}
            </p>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-4 text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[48px] font-medium"
          >
            Guardar Gasto
          </button>
        </div>
      </form>
    </div>
  );
};

export default BudgetExpenseForm;