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

const CasualExpensesForm = ({ expense, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'alimentacion',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Categorías predefinidas para gastos casuales
  const categories = [
    { value: 'alimentacion', label: '🍽️ Alimentación' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'entretenimiento', label: '🎬 Entretenimiento' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'compras', label: '🛒 Compras Personales' },
    { value: 'servicios', label: '🔧 Servicios' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'otros', label: '📦 Otros' }
  ];

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount || '',
        date: expense.date || new Date().toISOString().split('T')[0],
        category: expense.category || 'alimentacion',
        notes: expense.notes || ''
      });
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }
    
    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const expenseData = {
        ...formData,
        id: expense ? expense.id : Date.now(),
        amount: parseFloat(formData.amount),
        type: 'casual', // Identificador para distinguir de gastos de presupuesto
        createdAt: expense ? expense.createdAt : new Date().toISOString()
      };
      
      onSubmit(expenseData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          💸 {expense ? 'Editar' : 'Registrar'} Gasto Casual
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Almuerzo en restaurante, Gasolina, etc."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Monto y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="0"
              step="1"
              className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (Opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none"
            placeholder="Información adicional sobre el gasto..."
          />
        </div>

        {/* Vista previa del monto */}
        {formData.amount && (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="text-center">
              <span className="text-sm text-gray-600">Monto del gasto:</span>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(parseFloat(formData.amount) || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
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
            {expense ? 'Actualizar' : 'Registrar'} Gasto
          </button>
        </div>
      </form>
    </div>
  );
};

export default CasualExpensesForm;