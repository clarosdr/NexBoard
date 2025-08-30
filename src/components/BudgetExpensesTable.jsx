import React, { useState, useEffect } from 'react';
import BudgetExpenseForm from './BudgetExpenseForm';
import PullToRefresh from './PullToRefresh';
import { useSwipeCard } from '../hooks/useTouchGestures';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const BudgetExpensesTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar gastos del localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('budgetExpenses');
    if (savedExpenses) {
      const parsedExpenses = JSON.parse(savedExpenses);
      setExpenses(parsedExpenses);
      setFilteredExpenses(parsedExpenses);
    }
  }, []);

  // Guardar gastos en localStorage
  useEffect(() => {
    localStorage.setItem('budgetExpenses', JSON.stringify(expenses));
  }, [expenses]);

  // Filtrar gastos
  useEffect(() => {
    let filtered = expenses;

    // Filtro por estado
    if (filterStatus === 'paid') {
      filtered = filtered.filter(expense => expense.isPaid);
    } else if (filterStatus === 'unpaid') {
      filtered = filtered.filter(expense => !expense.isPaid);
    } else if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(expense => !expense.isPaid && expense.dueDate < today);
    } else if (filterStatus === 'due_soon') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      filtered = filtered.filter(expense => !expense.isPaid && expense.dueDate <= nextWeek && expense.dueDate >= today.toISOString().split('T')[0]);
    }

    // Filtro por categoría
    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExpenses(filtered);
  }, [expenses, filterStatus, filterCategory, searchTerm]);

  const categoryOptions = [
    { value: 'all', label: 'Todas las Categorías' },
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

  const getExpenseCountByStatus = (status) => {
    if (status === 'all') return expenses.length;
    if (status === 'paid') return expenses.filter(e => e.isPaid).length;
    if (status === 'unpaid') return expenses.filter(e => !e.isPaid).length;
    if (status === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      return expenses.filter(e => !e.isPaid && e.dueDate < today).length;
    }
    if (status === 'due_soon') {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return expenses.filter(e => !e.isPaid && e.dueDate <= nextWeek && e.dueDate >= today.toISOString().split('T')[0]).length;
    }
    return 0;
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      weekly: 'Semanal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual'
    };
    return labels[frequency] || frequency;
  };

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (expense) => {
    if (expense.isPaid) {
      return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Pagado</span>;
    }
    
    const daysUntilDue = getDaysUntilDue(expense.dueDate);
    
    if (daysUntilDue < 0) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Vencido</span>;
    } else if (daysUntilDue <= 7) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Próximo a vencer</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">Pendiente</span>;
    }
  };

  const handleSubmit = (expenseData) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(expense => 
        expense.id === editingExpense.id ? expenseData : expense
      ));
    } else {
      setExpenses(prev => [...prev, expenseData]);
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    }
  };

  const togglePaidStatus = (expenseId) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId 
        ? { ...expense, isPaid: !expense.isPaid, updatedAt: new Date().toISOString() }
        : expense
    ));
  };

  const calculateTotalByStatus = () => {
    const paid = expenses.filter(e => e.isPaid).reduce((sum, e) => sum + e.amount, 0);
    const unpaid = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { paid, unpaid, total };
  };

  const totals = calculateTotalByStatus();

  const handleRefresh = () => {
    // Actualizar filtros y búsqueda
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    
    // Recargar datos desde localStorage
    const savedExpenses = localStorage.getItem('budgetExpenses');
    if (savedExpenses) {
      try {
        const parsedExpenses = JSON.parse(savedExpenses);
        setExpenses(parsedExpenses);
        setFilteredExpenses(parsedExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }
    
    // Feedback visual
    const originalTitle = document.title;
    document.title = '🔄 Actualizando gastos...';
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (showForm) {
    return (
      <BudgetExpenseForm
        expense={editingExpense}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingExpense(null);
        }}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Presupuesto Personal</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Nuevo Gasto
        </button>
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Total Gastos</h3>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(totals.total)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Pagados</h3>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.paid)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Pendientes</h3>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totals.unpaid)}</p>
        </div>
      </div>

      {/* Filtros por pestañas */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'Todos', color: 'gray' },
            { key: 'unpaid', label: 'Pendientes', color: 'blue' },
            { key: 'paid', label: 'Pagados', color: 'green' },
            { key: 'due_soon', label: 'Próximos a vencer', color: 'yellow' },
            { key: 'overdue', label: 'Vencidos', color: 'red' }
          ].map(status => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status.key
                  ? `bg-${status.color}-600 text-white`
                  : `bg-${status.color}-100 text-${status.color}-800 hover:bg-${status.color}-200`
              }`}
            >
              {status.label} ({getExpenseCountByStatus(status.key)})
            </button>
          ))}
        </div>

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descripción o notas..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de gastos */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay gastos que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frecuencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-500">{expense.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getFrequencyLabel(expense.frequency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(expense.dueDate).toLocaleDateString('es-CO')}
                        {!expense.isPaid && (
                          <div className="text-xs">
                            {getDaysUntilDue(expense.dueDate) >= 0 
                              ? `${getDaysUntilDue(expense.dueDate)} días restantes`
                              : `${Math.abs(getDaysUntilDue(expense.dueDate))} días vencido`
                            }
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => togglePaidStatus(expense.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          expense.isPaid
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {expense.isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                      </button>
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="lg:hidden space-y-4">
            {filteredExpenses.map((expense) => {
              const SwipeableCard = ({ children, onSwipeLeft, onSwipeRight }) => {
                const { swipeHandlers, currentX, isDragging } = useSwipeCard({
                  onSwipeLeft,
                  onSwipeRight,
                  threshold: 100
                });

                return (
                  <div 
                    {...swipeHandlers}
                    className={`relative overflow-hidden ${
                      isDragging ? 'transition-none' : 'transition-transform duration-200'
                    }`}
                    style={{
                      transform: `translateX(${currentX}px)`
                    }}
                  >
                    {/* Acciones de fondo */}
                    <div className="absolute inset-0 flex">
                      {/* Acción derecha (Editar) */}
                      <div className="flex-1 bg-blue-500 flex items-center justify-start pl-4">
                        <div className="text-white text-center">
                          <div className="text-2xl mb-1">✏️</div>
                          <div className="text-xs font-medium">Editar</div>
                        </div>
                      </div>
                      {/* Acción izquierda (Eliminar) */}
                      <div className="flex-1 bg-red-500 flex items-center justify-end pr-4">
                        <div className="text-white text-center">
                          <div className="text-2xl mb-1">🗑️</div>
                          <div className="text-xs font-medium">Eliminar</div>
                        </div>
                      </div>
                    </div>
                    {/* Contenido de la tarjeta */}
                    <div className="relative bg-white">
                      {children}
                    </div>
                  </div>
                );
              };

              return (
                <SwipeableCard 
                  key={expense.id}
                  onSwipeLeft={() => handleDelete(expense.id)}
                  onSwipeRight={() => handleEdit(expense)}
                >
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-3">
                {/* Header del Card */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{expense.description}</h3>
                    {expense.notes && (
                      <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(expense)}
                  </div>
                </div>
                
                {/* Información Principal */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Monto:</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Categoría:</p>
                    <p className="text-gray-900">{getCategoryLabel(expense.category)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Frecuencia:</p>
                    <p className="text-gray-900">{getFrequencyLabel(expense.frequency)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Vencimiento:</p>
                    <p className="text-gray-900">{new Date(expense.dueDate).toLocaleDateString('es-CO')}</p>
                    {!expense.isPaid && (
                      <p className={`text-xs mt-1 ${
                        getDaysUntilDue(expense.dueDate) >= 0 ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {getDaysUntilDue(expense.dueDate) >= 0 
                          ? `${getDaysUntilDue(expense.dueDate)} días restantes`
                          : `${Math.abs(getDaysUntilDue(expense.dueDate))} días vencido`
                        }
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => togglePaidStatus(expense.id)}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium touch-manipulation ${
                      expense.isPaid
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                  >
                    {expense.isPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                  </button>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-sm font-medium touch-manipulation"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm font-medium touch-manipulation"
                  >
                    Eliminar
                  </button>
                </div>
                </div>
                </SwipeableCard>
              );
            })}
          </div>
        </>
      )}
      </div>
    </PullToRefresh>
  );
};

export default BudgetExpensesTable;