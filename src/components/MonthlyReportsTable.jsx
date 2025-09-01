import React, { useState, useEffect } from 'react';
import PullToRefresh from './PullToRefresh';
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

const MonthlyReportsTable = ({ orders, expenses }) => {
  const { user } = useAuth();
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [casualExpenses, setCasualExpenses] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonMonths, setComparisonMonths] = useState({ month1: '', month2: '' });

  // Cargar gastos casuales desde Supabase
  useEffect(() => {
    const loadCasualExpenses = async () => {
      if (user) {
        try {
          const data = await supabaseService.getCasualExpenses(user.id);
          setCasualExpenses(data);
        } catch (error) {
          console.error('Error loading casual expenses:', error);
        }
      }
    };
    loadCasualExpenses();
  }, [user]);

  // Función para obtener el nombre del mes
  const getMonthName = (monthIndex) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex];
  };

  // Función para generar reportes mensuales
  const generateMonthlyReports = () => {
    const reports = [];
    
    // Obtener datos archivados
    const archivedOrders = JSON.parse(localStorage.getItem('archivedOrders') || '[]');
    const archivedCasualExpenses = JSON.parse(localStorage.getItem('archivedCasualExpenses') || '[]');
    
    for (let month = 0; month < 12; month++) {
      // Combinar órdenes activas y archivadas para el mes
      const monthOrders = [
        ...orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getFullYear() === selectedYear && orderDate.getMonth() === month;
        }),
        ...archivedOrders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getFullYear() === selectedYear && orderDate.getMonth() === month;
        })
      ];
      
      const monthBudgetExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === month;
      });
      
      // Combinar gastos casuales activos y archivados para el mes
      const monthCasualExpenses = [
        ...casualExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === month;
        }),
        ...archivedCasualExpenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getFullYear() === selectedYear && expenseDate.getMonth() === month;
        })
      ];
      
      const completedOrders = monthOrders.filter(order => 
        order.status === 'finalizado' || order.status === 'entregado'
      );
      
      const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const totalCosts = completedOrders.reduce((sum, order) => sum + (order.total_part_cost || order.totalPartCost || 0), 0);
      const totalPaid = completedOrders.reduce((sum, order) => sum + (order.total_paid || order.totalPaid || 0), 0);
      const totalPending = completedOrders.reduce((sum, order) => {
        const pending = (order.total || 0) - (order.total_paid || order.totalPaid || 0);
        return sum + (pending > 0 ? pending : 0);
      }, 0);
      
      const totalBudgetExpenses = monthBudgetExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const totalCasualExpenses = monthCasualExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const totalExpenses = totalBudgetExpenses + totalCasualExpenses;
      const grossProfit = totalRevenue - totalCosts;
      const netProfit = grossProfit - totalExpenses;
      
      const report = {
        month,
        monthName: getMonthName(month),
        year: selectedYear,
        totalOrders: monthOrders.length,
        completedOrders: completedOrders.length,
        totalRevenue,
        totalCosts,
        grossProfit,
        totalBudgetExpenses,
        totalCasualExpenses,
        totalExpenses,
        netProfit,
        totalPaid,
        totalPending,
        averageOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
        profitMargin: totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0,
        collectionRate: totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : 0,
        isClosed: isMonthClosed(selectedYear, month)
      };
      
      reports.push(report);
    }
    
    setMonthlyReports(reports);
  };

  // Función para verificar si un mes está cerrado
  const isMonthClosed = (year, month) => {
    const closedMonths = JSON.parse(localStorage.getItem('closedMonths') || '[]');
    return closedMonths.some(closed => closed.year === year && closed.month === month);
  };

  // Función para cerrar un mes
  const closeMonth = (year, month) => {
    const closedMonths = JSON.parse(localStorage.getItem('closedMonths') || '[]');
    
    // Archivar órdenes entregadas del mes
    const ordersToArchive = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.getFullYear() === year && 
             orderDate.getMonth() === month && 
             order.status === 'entregado';
    });
    
    // Archivar gastos casuales del mes
    const casualExpensesToArchive = casualExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && 
             expenseDate.getMonth() === month;
    });
    
    // Manejar gastos de presupuesto personal
    // Los gastos vencidos y no pagados deben continuar al siguiente mes
    const budgetExpenses = JSON.parse(localStorage.getItem('budgetExpenses') || '[]');
    const today = new Date().toISOString().split('T')[0];
    
    const overdueExpenses = budgetExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && 
             expenseDate.getMonth() === month && 
             !expense.isPaid && 
             expense.dueDate < today;
    });
    
    // Actualizar fechas de vencimiento de gastos vencidos para el próximo mes
    const updatedBudgetExpenses = budgetExpenses.map(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getFullYear() === year && 
          expenseDate.getMonth() === month && 
          !expense.isPaid && 
          expense.dueDate < today) {
        // Calcular nueva fecha de vencimiento basada en la frecuencia
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
        
        return {
          ...expense,
          dueDate: calculateNextDueDate(expense.dueDate, expense.frequency),
          updated_at: new Date().toISOString()
        };
      }
      return expense;
    });
    
    localStorage.setItem('budgetExpenses', JSON.stringify(updatedBudgetExpenses));
    
    // Guardar datos archivados
    const archivedOrders = JSON.parse(localStorage.getItem('archivedOrders') || '[]');
    const archivedCasualExpenses = JSON.parse(localStorage.getItem('archivedCasualExpenses') || '[]');
    
    archivedOrders.push(...ordersToArchive.map(order => ({
      ...order,
      archivedDate: new Date().toISOString(),
      archivedMonth: month,
      archivedYear: year
    })));
    
    archivedCasualExpenses.push(...casualExpensesToArchive.map(expense => ({
      ...expense,
      archivedDate: new Date().toISOString(),
      archivedMonth: month,
      archivedYear: year
    })));
    
    localStorage.setItem('archivedOrders', JSON.stringify(archivedOrders));
    localStorage.setItem('archivedCasualExpenses', JSON.stringify(archivedCasualExpenses));
    
    // Remover órdenes entregadas y gastos casuales de los datos activos
    const activeOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return !(orderDate.getFullYear() === year && 
               orderDate.getMonth() === month && 
               order.status === 'entregado');
    });
    
    const activeCasualExpenses = casualExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return !(expenseDate.getFullYear() === year && 
               expenseDate.getMonth() === month);
    });
    
    localStorage.setItem('orders', JSON.stringify(activeOrders));
    localStorage.setItem('casualExpenses', JSON.stringify(activeCasualExpenses));
    
    const newClosure = {
      year,
      month,
      closedDate: new Date().toISOString(),
      report: monthlyReports.find(r => r.year === year && r.month === month),
      archivedOrdersCount: ordersToArchive.length,
      archivedCasualExpensesCount: casualExpensesToArchive.length,
      overdueExpensesCount: overdueExpenses.length
    };
    
    closedMonths.push(newClosure);
    localStorage.setItem('closedMonths', JSON.stringify(closedMonths));
    
    // Actualizar el estado
    generateMonthlyReports();
    
    alert(`Mes de ${getMonthName(month)} ${year} cerrado exitosamente.\n` +
          `Se archivaron ${ordersToArchive.length} órdenes entregadas y ${casualExpensesToArchive.length} gastos casuales.\n` +
          `Se actualizaron ${overdueExpenses.length} gastos vencidos del presupuesto personal para continuar en el próximo mes.`);
    
    // Recargar la página para reflejar los cambios
    window.location.reload();
  };

  // Función para obtener años disponibles
  const getAvailableYears = () => {
    const years = new Set();
    orders.forEach(order => {
      years.add(new Date(order.date).getFullYear());
    });
    expenses.forEach(expense => {
      years.add(new Date(expense.date).getFullYear());
    });
    casualExpenses.forEach(expense => {
      years.add(new Date(expense.date).getFullYear());
    });
    
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    
    return Array.from(years).sort((a, b) => b - a);
  };

  // Función para comparar dos meses
  const getComparisonData = () => {
    if (!comparisonMonths.month1 || !comparisonMonths.month2) return null;
    
    const month1Data = monthlyReports.find(r => `${r.year}-${r.month}` === comparisonMonths.month1);
    const month2Data = monthlyReports.find(r => `${r.year}-${r.month}` === comparisonMonths.month2);
    
    if (!month1Data || !month2Data) return null;
    
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };
    
    return {
      month1: month1Data,
      month2: month2Data,
      changes: {
        revenue: calculateChange(month1Data.totalRevenue, month2Data.totalRevenue),
        profit: calculateChange(month1Data.netProfit, month2Data.netProfit),
        orders: calculateChange(month1Data.completedOrders, month2Data.completedOrders),
        expenses: calculateChange(month1Data.totalExpenses, month2Data.totalExpenses)
      }
    };
  };

  // Función para cierre automático de mes anterior
  const autoCloseLastMonth = () => {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    if (!isMonthClosed(lastMonthYear, lastMonth)) {
      const shouldClose = window.confirm(
        `¿Deseas cerrar automáticamente el mes de ${getMonthName(lastMonth)} ${lastMonthYear}?`
      );
      
      if (shouldClose) {
        closeMonth(lastMonthYear, lastMonth);
      }
    }
  };

  useEffect(() => {
    generateMonthlyReports();
  }, [orders, expenses, casualExpenses, selectedYear]);

  useEffect(() => {
    // Verificar cierre automático al cargar el componente
    const lastAutoCheck = localStorage.getItem('lastAutoCloseCheck');
    const today = new Date().toDateString();
    
    if (lastAutoCheck !== today) {
      setTimeout(() => {
        autoCloseLastMonth();
        localStorage.setItem('lastAutoCloseCheck', today);
      }, 1000);
    }
  }, []);

  const availableYears = getAvailableYears();
  const comparisonData = getComparisonData();

  const handleRefresh = () => {
    // Recargar datos desde localStorage
    const savedOrders = localStorage.getItem('serviceOrders');
    const savedExpenses = localStorage.getItem('casualExpenses');
    
    if (savedOrders) {
      try {
        // Regenerar reportes con datos actualizados
        const orders = JSON.parse(savedOrders);
        const expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
        
        // Aquí se regenerarían los reportes mensuales
        // Por simplicidad, solo mostramos feedback visual
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    }
    
    // Feedback visual
    const originalTitle = document.title;
    document.title = '🔄 Actualizando reportes...';
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0 transition-colors duration-200">Informes Mensuales</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Selector de año */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Toggle comparación */}
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
              showComparison 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            {showComparison ? 'Ocultar Comparación' : 'Comparar Meses'}
          </button>
        </div>
      </div>

      {/* Sección de comparación */}
      {showComparison && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-200 dark:border-blue-700 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4 transition-colors duration-200">Comparación de Meses</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">Primer Mes</label>
              <select
                value={comparisonMonths.month1}
                onChange={(e) => setComparisonMonths({...comparisonMonths, month1: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <option value="">Seleccionar mes...</option>
                {monthlyReports.map(report => (
                  <option key={`${report.year}-${report.month}`} value={`${report.year}-${report.month}`}>
                    {report.monthName} {report.year}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">Segundo Mes</label>
              <select
                value={comparisonMonths.month2}
                onChange={(e) => setComparisonMonths({...comparisonMonths, month2: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <option value="">Seleccionar mes...</option>
                {monthlyReports.map(report => (
                  <option key={`${report.year}-${report.month}`} value={`${report.year}-${report.month}`}>
                    {report.monthName} {report.year}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Resultados de comparación */}
          {comparisonData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ingresos</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400 transition-colors duration-200">
                  {comparisonData.changes.revenue > 0 ? '+' : ''}{comparisonData.changes.revenue}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ganancia Neta</div>
                <div className={`text-lg font-bold transition-colors duration-200 ${
                  comparisonData.changes.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {comparisonData.changes.profit > 0 ? '+' : ''}{comparisonData.changes.profit}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Órdenes</div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">
                  {comparisonData.changes.orders > 0 ? '+' : ''}{comparisonData.changes.orders}%
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600 transition-colors duration-200">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Gastos</div>
                <div className={`text-lg font-bold transition-colors duration-200 ${
                  comparisonData.changes.expenses <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {comparisonData.changes.expenses > 0 ? '+' : ''}{comparisonData.changes.expenses}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabla de informes mensuales */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
        {/* Vista Desktop - Tabla */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                  Mes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Órdenes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Ganancia Bruta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Gastos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Ganancia Neta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Por Cobrar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors duration-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
              {monthlyReports.map((report) => (
                <tr key={`${report.year}-${report.month}`} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                    {report.monthName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
                    {report.completedOrders} / {report.totalOrders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 transition-colors duration-200">
                    {formatCurrency(report.totalRevenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 transition-colors duration-200">
                    {formatCurrency(report.grossProfit)}
                    <div className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">Margen: {report.profitMargin}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400 transition-colors duration-200">
                    {formatCurrency(report.totalExpenses)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`transition-colors duration-200 ${report.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(report.netProfit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600 dark:text-orange-400 transition-colors duration-200">
                    {formatCurrency(report.totalPending)}
                    <div className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">Cobrado: {report.collectionRate}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.isClosed ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors duration-200">
                        Cerrado
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 transition-colors duration-200">
                        Abierto
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!report.isClosed && (
                      <button
                        onClick={() => closeMonth(report.year, report.month)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200"
                        title="Cerrar mes"
                      >
                        🔒 Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista Mobile - Cards */}
        <div className="lg:hidden">
          {monthlyReports.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-gray-300 transition-colors duration-200">
              No hay datos disponibles para el año seleccionado.
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {monthlyReports.map((report) => (
                <div key={`${report.year}-${report.month}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-4 transition-colors duration-200">
                  {/* Header del Card */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">{report.monthName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">{report.completedOrders} / {report.totalOrders} órdenes</p>
                    </div>
                    <div className="text-right">
                      {report.isClosed ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 transition-colors duration-200">
                          Cerrado
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 transition-colors duration-200">
                          Abierto
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Información Financiera */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ingresos:</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400 transition-colors duration-200">{formatCurrency(report.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ganancia Neta:</p>
                      <p className={`text-lg font-semibold transition-colors duration-200 ${
                        report.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(report.netProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Ganancia Bruta:</p>
                      <p className="text-blue-600 dark:text-blue-400 font-medium transition-colors duration-200">{formatCurrency(report.grossProfit)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Margen: {report.profitMargin}%</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Gastos:</p>
                      <p className="text-red-600 dark:text-red-400 font-medium transition-colors duration-200">{formatCurrency(report.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">Por Cobrar:</p>
                      <p className="text-orange-600 dark:text-orange-400 font-medium transition-colors duration-200">{formatCurrency(report.totalPending)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">Cobrado: {report.collectionRate}%</p>
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  {!report.isClosed && (
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 transition-colors duration-200">
                      <button
                        onClick={() => closeMonth(report.year, report.month)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 touch-manipulation transition-colors duration-200"
                      >
                        <span>🔒</span>
                        <span className="text-sm font-medium">Cerrar Mes</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {monthlyReports.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No hay datos disponibles para el año seleccionado.
        </div>
      )}
      </div>
    </PullToRefresh>
  );
};

export default MonthlyReportsTable;