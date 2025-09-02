import React, { useState, useEffect } from 'react';
import BudgetExpenseForm from './BudgetExpenseForm';
import PullToRefresh from './PullToRefresh';
import { useSwipeCard } from '../hooks/useTouchGestures';
import { useAuth } from '../hooks/useAuth';
import { supabaseService } from '../lib/supabase';

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
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar gastos desde Supabase
  useEffect(() => {
    const loadExpenses = async () => {
      if (user) {
        try {
          const data = await supabaseService.getBudgetExpenses(user.id);
          setExpenses(data);
          setFilteredExpenses(data);
        } catch (error) {
          console.error('Error loading budget expenses:', error);
        }
      }
    };
    loadExpenses();
  }, [user]);

  // Filtrar gastos
  useEffect(() => {
    let filtered = expenses;

    // Filtro por estado (simplificado usando fecha de vencimiento)
    if (filterStatus === 'overdue') {
      const todayStr = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(expense => expense.date < todayStr);
    } else if (filterStatus === 'due_soon') {
      const today = new Date();
      const nextWeekStr = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      filtered = filtered.filter(expense => expense.date <= nextWeekStr && expense.date >= todayStr);
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
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'mi_hija', label: '👧 Mi hija' },
    { value: 'mama', label: '👩 Mamá' },
    { value: 'deudas', label: '💳 Deudas' },
    { value: 'sueldo', label: '💼 Sueldo' },
    { value: 'sueldo_2', label: '💼 Sueldo 2' }
  ];

  const getExpenseCountByStatus = (status) => {
    if (status === 'all') return expenses.length;
    if (status === 'overdue') {
      const todayStr = new Date().toISOString().split('T')[0];
      return expenses.filter(e => e.date < todayStr).length;
    }
    if (status === 'due_soon') {
      const today = new Date();
      const nextWeekStr = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      return expenses.filter(e => e.date <= nextWeekStr && e.date >= todayStr).length;
    }
    return 0;
  };

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const getDaysUntilDue = (date) => {
    const today = new Date();
    const due = new Date(date);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (expense) => {
    const daysUntilDue = getDaysUntilDue(expense.date);
    if (daysUntilDue < 0) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full transition-colors duration-200">Vencido</span>;
    } else if (daysUntilDue <= 7) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full transition-colors duration-200">Próximo a vencer</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full transition-colors duration-200">Al día</span>;
    }
  };

  const handleSubmit = async (expenseData) => {
    try {
      if (editingExpense) {
        const updatedExpense = await supabaseService.updateBudgetExpense(editingExpense.id, expenseData);
        setExpenses(prev => prev.map(expense => 
          expense.id === editingExpense.id ? updatedExpense : expense
        ));
      } else {
        const newExpense = await supabaseService.createBudgetExpense({
          ...expenseData,
          user_id: user.id
        });
        setExpenses(prev => [...prev, newExpense]);
      }
      setShowForm(false);
      setEditingExpense(null);
    } catch (error) {
      console.error('Error saving budget expense:', error);
      alert('Error al guardar el gasto. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      try {
        await supabaseService.deleteBudgetExpense(expenseId);
        setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
      } catch (error) {
        console.error('Error deleting budget expense:', error);
        alert('Error al eliminar el gasto. Por favor, intenta de nuevo.');
      }
    }
  };

  const calculateTotal = () => {
    const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    return { total };
  };

  const totals = calculateTotal();

  const handleRefresh = async () => {
    // Actualizar filtros y búsqueda
    setSearchTerm('');
    setFilterCategory('all');
    setFilterStatus('all');
    
    // Recargar datos desde Supabase
    if (user) {
      try {
        const data = await supabaseService.getBudgetExpenses(user.id);
        setExpenses(data);
        setFilteredExpenses(data);
      } catch (error) {
        console.error('Error loading budget expenses:', error);
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
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:border dark:border-gray-700 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Presupuesto Personal</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        >
          + Nuevo Gasto
        </button>
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border dark:border-blue-800 transition-colors duration-200">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 transition-colors duration-200">Total Gastos</h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 transition-colors duration-200">{formatCurrency(totals.total)}</p>
        </div>
      </div>

      {/* Filtros por pestañas */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all', label: 'Todos', color: 'gray' },
            { key: 'due_soon', label: 'Próximos a vencer', color: 'yellow' },
            { key: 'overdue', label: 'Vencidos', color: 'red' }
          ].map(status => (
            <button
              key={status.key}
              onClick={() => setFilterStatus(status.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                filterStatus === status.key
                  ? status.color === 'gray' ? 'bg-gray-600 dark:bg-gray-500 text-white'
                  : status.color === 'yellow' ? 'bg-yellow-600 dark:bg-yellow-500 text-white'
                  : status.color === 'red' ? 'bg-red-600 dark:bg-red-500 text-white'
                  : 'bg-gray-600 text-white'
                  : status.color === 'gray' ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                  : status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status.label} ({getExpenseCountByStatus(status.key)})
            </button>
          ))}
        </div>

        {/* Filtros adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descripción o notas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">Categoría</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
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
          <p className="text-gray-500 dark:text-gray-400 transition-colors duration-200">No hay gastos que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">{expense.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
                      <div>
                        {new Date(expense.date).toLocaleDateString('es-CO')}
                        <div className="text-xs">
                          {getDaysUntilDue(expense.date) >= 0 
                            ? `${getDaysUntilDue(expense.date)} días restantes`
                            : `${Math.abs(getDaysUntilDue(expense.date))} días vencido`
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(expense)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:bg-blue-300 transition-colors duration-200"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors duration-200"
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
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-3 transition-colors duration-200">
                {/* Header del Card */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{expense.description}</h3>
                    {expense.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">{expense.notes}</p>
                    )}
                  </div>
                  <div className="ml-3">
                    {getStatusBadge(expense)}
                  </div>
                </div>
                
                {/* Información Principal */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Monto:</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{formatCurrency(expense.amount)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Categoría:</p>
                    <p className="text-gray-900 dark:text-gray-200 transition-colors duration-200">{getCategoryLabel(expense.category)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Vencimiento:</p>
                    <p className="text-gray-900 dark:text-gray-200 transition-colors duration-200">{new Date(expense.date).toLocaleDateString('es-CO')}</p>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      getDaysUntilDue(expense.date) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {getDaysUntilDue(expense.date) >= 0 
                        ? `${getDaysUntilDue(expense.date)} días restantes`
                        : `${Math.abs(getDaysUntilDue(expense.date))} días vencido`
                      }
                    </p>
                  </div>
                </div>
                
                {/* Acciones */}
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
                  <button
                    onClick={() => handleEdit(expense)}
                    className="flex-1 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 text-sm font-medium touch-manipulation transition-colors duration-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-sm font-medium touch-manipulation transition-colors duration-200"
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