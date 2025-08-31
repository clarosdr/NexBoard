import React, { useState, useEffect } from 'react';
import CasualExpensesForm from './CasualExpensesForm';
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

const CasualExpensesTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Categorías para filtros
  const categories = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'alimentacion', label: '🍽️ Alimentación' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'entretenimiento', label: '🎬 Entretenimiento' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'compras', label: '🛒 Compras Personales' },
    { value: 'servicios', label: '🔧 Servicios' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'otros', label: '📦 Otros' }
  ];

  // Cargar gastos desde localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('nexboard-casual-expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (error) {
        console.error('Error loading casual expenses:', error);
      }
    }
  }, []);

  // Guardar gastos en localStorage
  useEffect(() => {
    localStorage.setItem('nexboard-casual-expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDeleteExpense = (expenseId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    }
  };

  const handleFormSubmit = (expenseData) => {
    if (editingExpense) {
      // Actualizar gasto existente
      setExpenses(prev => prev.map(expense => 
        expense.id === editingExpense.id ? expenseData : expense
      ));
    } else {
      // Agregar nuevo gasto
      setExpenses(prev => [...prev, expenseData]);
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  // Obtener gastos archivados si es necesario
  const archivedExpenses = showArchived ? JSON.parse(localStorage.getItem('archivedCasualExpenses') || '[]') : [];
  const allExpenses = showArchived ? archivedExpenses : expenses;

  // Filtrar gastos
  const filteredExpenses = allExpenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    const matchesMonth = !selectedMonth || expense.date.startsWith(selectedMonth);
    
    return matchesSearch && matchesCategory && matchesMonth;
  });

  // Ordenar por fecha (más reciente primero)
  const sortedExpenses = filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calcular totales
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalByCategory = categories.slice(1).map(cat => ({
    ...cat,
    total: filteredExpenses
      .filter(expense => expense.category === cat.value)
      .reduce((sum, expense) => sum + expense.amount, 0)
  })).filter(cat => cat.total > 0);

  // Obtener meses únicos para el filtro
  const availableMonths = [...new Set(expenses.map(expense => expense.date.substring(0, 7)))]
    .sort((a, b) => b.localeCompare(a));

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryLabel = (categoryValue) => {
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const handleRefresh = () => {
    // Limpiar filtros
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedMonth('');
    
    // Recargar datos desde localStorage
    const savedExpenses = localStorage.getItem('nexboard-casual-expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
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
      <CasualExpensesForm
        expense={editingExpense}
        onSubmit={handleFormSubmit}
        onCancel={handleCancelForm}
      />
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white transition-colors duration-200">💸 Gastos Casuales</h1>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              showArchived 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showArchived ? 'Ver Activos' : 'Ver Archivados'}
          </button>
          {showArchived && (
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded transition-colors duration-200">
              Datos Archivados
            </span>
          )}
        </div>
        <button
          onClick={handleAddExpense}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          disabled={showArchived}
        >
          + Registrar Gasto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descripción o notas..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
              Mes
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
            >
              <option value="">Todos los meses</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedMonth('');
              }}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total general */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 transition-colors duration-200">💰 Total Gastado</h3>
          <div className="text-3xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">
            {filteredExpenses.length} gasto{filteredExpenses.length !== 1 ? 's' : ''} registrado{filteredExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Por categorías */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 transition-colors duration-200">📊 Por Categorías</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {totalByCategory.map(cat => (
              <div key={cat.value} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">{cat.label}</span>
                <span className="font-semibold text-gray-800 dark:text-white transition-colors duration-200">
                  {formatCurrency(cat.total)}
                </span>
              </div>
            ))}
            {totalByCategory.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors duration-200">No hay gastos en el período seleccionado</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de gastos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden transition-colors duration-200">
        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No hay gastos registrados</p>
                    <p className="text-sm">Haz clic en "Registrar Gasto" para agregar tu primer gasto casual</p>
                  </td>
                </tr>
              ) : (
                sortedExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white transition-colors duration-200">
                      <div>
                        <div className="font-medium">{expense.description}</div>
                        {expense.notes && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 transition-colors duration-200">{expense.notes}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white transition-colors duration-200">
                      {getCategoryLabel(expense.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 dark:text-red-400 transition-colors duration-200">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile - Cards */}
        <div className="lg:hidden">
          {sortedExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
              <div className="text-4xl mb-2">📝</div>
              <p>No hay gastos registrados</p>
              <p className="text-sm">Haz clic en "Registrar Gasto" para agregar tu primer gasto casual</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {sortedExpenses.map((expense) => {
                const SwipeableCard = ({ children }) => {
                const { swipeHandlers, currentX, isDragging } = useSwipeCard({
                  onSwipeLeft: () => handleDeleteExpense(expense.id),
                  onSwipeRight: () => handleEditExpense(expense),
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
                      <div className="relative bg-white dark:bg-gray-800 transition-colors duration-200">
                        {children}
                      </div>
                    </div>
                  );
                };

                return (
                  <SwipeableCard key={expense.id}>
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-3 transition-colors duration-200">
                  {/* Header del Card */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{expense.description}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">{formatDate(expense.date)}</p>
                      {expense.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-200">{expense.notes}</p>
                      )}
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400 transition-colors duration-200">{formatCurrency(expense.amount)}</p>
                    </div>
                  </div>
                  
                  {/* Información */}
                  <div className="text-sm">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Categoría:</p>
                      <p className="text-gray-900 dark:text-white transition-colors duration-200">{getCategoryLabel(expense.category)}</p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 touch-manipulation transition-colors duration-200"
                    >
                      <span>✏️</span>
                      <span className="text-sm font-medium">Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 touch-manipulation transition-colors duration-200"
                    >
                      <span>🗑️</span>
                      <span className="text-sm font-medium">Eliminar</span>
                    </button>
                  </div>
                  </div>
                </SwipeableCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
};

export default CasualExpensesTable;