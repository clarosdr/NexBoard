import React, { useState, useEffect } from 'react';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const FinancialDashboard = ({ orders, expenses }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [casualExpenses, setCasualExpenses] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    totalPaid: 0,
    totalPending: 0,
    totalBudgetExpenses: 0,
    totalCasualExpenses: 0,
    totalExpenses: 0,
    netProfit: 0,
    completedOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0
  });

  // Cargar gastos casuales desde localStorage
  useEffect(() => {
    const savedCasualExpenses = localStorage.getItem('nexboard-casual-expenses');
    if (savedCasualExpenses) {
      try {
        setCasualExpenses(JSON.parse(savedCasualExpenses));
      } catch (error) {
        console.error('Error loading casual expenses:', error);
      }
    }
  }, []);

  // Función para filtrar datos por período
  const filterDataByPeriod = (data, period) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      
      switch (period) {
        case 'current_month':
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        case 'last_month':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastMonthYear;
        case 'current_year':
          return itemDate.getFullYear() === currentYear;
        case 'all_time':
        default:
          return true;
      }
    });
  };

  // Calcular métricas del dashboard
  useEffect(() => {
    const filteredOrders = filterDataByPeriod(orders || [], selectedPeriod);
    const filteredBudgetExpenses = filterDataByPeriod(expenses || [], selectedPeriod);
    const filteredCasualExpenses = filterDataByPeriod(casualExpenses || [], selectedPeriod);
    
    const completedOrders = filteredOrders.filter(order => 
      order.status === 'finalizado' || order.status === 'entregado'
    );
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalCosts = completedOrders.reduce((sum, order) => sum + (order.totalPartCost || 0), 0);
    const totalProfit = totalRevenue - totalCosts;
    
    const totalPaid = completedOrders.reduce((sum, order) => sum + (order.totalPaid || 0), 0);
    const totalPending = completedOrders.reduce((sum, order) => {
      const pending = (order.total || 0) - (order.totalPaid || 0);
      return sum + (pending > 0 ? pending : 0);
    }, 0);
    
    const totalBudgetExpenses = filteredBudgetExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalCasualExpenses = filteredCasualExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalExpenses = totalBudgetExpenses + totalCasualExpenses;
    const netProfit = totalProfit - totalExpenses;
    
    const pendingOrders = filteredOrders.filter(order => 
      order.status === 'pendiente' || order.status === 'en_proceso'
    ).length;
    
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    setDashboardData({
      totalRevenue,
      totalCosts,
      totalProfit,
      totalPaid,
      totalPending,
      totalBudgetExpenses,
      totalCasualExpenses,
      totalExpenses,
      netProfit,
      completedOrders: completedOrders.length,
      pendingOrders,
      averageOrderValue
    });
  }, [orders, expenses, casualExpenses, selectedPeriod]);

  // Función para obtener el color del indicador según el valor
  const getIndicatorColor = (value, isPositive = true) => {
    if (value === 0) return 'text-gray-600';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  // Función para calcular el porcentaje de margen de ganancia
  const getProfitMargin = () => {
    if (dashboardData.totalRevenue === 0) return 0;
    return ((dashboardData.totalProfit / dashboardData.totalRevenue) * 100).toFixed(1);
  };

  // Función para calcular el porcentaje de cobro
  const getCollectionRate = () => {
    if (dashboardData.totalRevenue === 0) return 0;
    return ((dashboardData.totalPaid / dashboardData.totalRevenue) * 100).toFixed(1);
  };

  const periodOptions = [
    { value: 'current_month', label: 'Mes Actual' },
    { value: 'last_month', label: 'Mes Anterior' },
    { value: 'current_year', label: 'Año Actual' },
    { value: 'all_time', label: 'Todo el Tiempo' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Dashboard Financiero</h2>
        
        {/* Selector de período */}
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {periodOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Ingresos Totales */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(dashboardData.totalRevenue)}
              </p>
            </div>
            <div className="text-3xl text-green-600">💰</div>
          </div>
        </div>

        {/* Ganancia Bruta */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Ganancia Bruta</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(dashboardData.totalProfit)}
              </p>
              <p className="text-xs text-blue-600">Margen: {getProfitMargin()}%</p>
            </div>
            <div className="text-3xl text-blue-600">📈</div>
          </div>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Ganancia Neta</p>
              <p className={`text-2xl font-bold ${getIndicatorColor(dashboardData.netProfit)}`}>
                {formatCurrency(dashboardData.netProfit)}
              </p>
              <p className="text-xs text-purple-600">Después de gastos</p>
            </div>
            <div className="text-3xl text-purple-600">🎯</div>
          </div>
        </div>

        {/* Por Cobrar */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Por Cobrar</p>
              <p className="text-2xl font-bold text-orange-900">
                {formatCurrency(dashboardData.totalPending)}
              </p>
              <p className="text-xs text-orange-600">Cobrado: {getCollectionRate()}%</p>
            </div>
            <div className="text-3xl text-orange-600">⏳</div>
          </div>
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Órdenes Completadas */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Órdenes Completadas</p>
            <p className="text-3xl font-bold text-gray-900">{dashboardData.completedOrders}</p>
          </div>
        </div>

        {/* Valor Promedio por Orden */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">Valor Promedio/Orden</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(dashboardData.averageOrderValue)}
            </p>
          </div>
        </div>

        {/* Gastos de Presupuesto */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">Gastos Presupuesto</p>
            <p className="text-2xl font-bold text-red-700">
              {formatCurrency(dashboardData.totalBudgetExpenses)}
            </p>
            <p className="text-xs text-red-600">Gastos fijos</p>
          </div>
        </div>

        {/* Gastos Casuales */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-center">
            <p className="text-sm font-medium text-yellow-600">Gastos Casuales</p>
            <p className="text-2xl font-bold text-yellow-700">
              {formatCurrency(dashboardData.totalCasualExpenses)}
            </p>
            <p className="text-xs text-yellow-600">Variables</p>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-300">
          <div className="text-center">
            <p className="text-sm font-medium text-red-700">Total Gastos</p>
            <p className="text-2xl font-bold text-red-800">
              {formatCurrency(dashboardData.totalExpenses)}
            </p>
            <p className="text-xs text-red-700">Presupuesto + Casuales</p>
          </div>
        </div>
      </div>

      {/* Resumen de flujo de caja */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Flujo de Caja</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Ingresos</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Facturado:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(dashboardData.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cobrado:</span>
                <span className="font-medium text-teal-600">
                  {formatCurrency(dashboardData.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Pendiente por Cobrar:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(dashboardData.totalPending)}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Egresos</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Costos de Servicios:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(dashboardData.totalCosts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gastos Operativos:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(dashboardData.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total Egresos:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(dashboardData.totalCosts + dashboardData.totalExpenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resultado final */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-800">Resultado Neto:</span>
            <span className={`text-2xl font-bold ${
              dashboardData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(dashboardData.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;