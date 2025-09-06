import React from 'react';
import { useOrders } from '../hooks/useOrders';
import { useExpenses } from '../hooks/useExpenses';

const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseInt(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const FinancialDashboard = () => {
  const { orders, loading: loadingOrders } = useOrders();
  const { casualExpenses, budgetExpenses, loading: loadingExpenses } = useExpenses();

  const totalVentas = orders.reduce((sum, o) => sum + (o.ventas || 0), 0);
  const totalGanancia = orders.reduce((sum, o) => sum + (o.ganancia || 0), 0);
  const totalCasuales = casualExpenses.reduce((sum, e) => sum + (e.monto || 0), 0);
  const totalPresupuesto = budgetExpenses.reduce((sum, e) => sum + (e.monto || 0), 0);
  const totalGastos = totalCasuales + totalPresupuesto;
  const balanceFinal = totalGanancia - totalGastos;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📈 Resumen Financiero</h2>

      {(loadingOrders || loadingExpenses) ? (
        <p>Cargando datos financieros...</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Ventas Totales</h3>
            <p>{formatCurrency(totalVentas)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Ganancia Neta</h3>
            <p>{formatCurrency(totalGanancia)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Gastos Casuales</h3>
            <p>{formatCurrency(totalCasuales)}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Gastos Presupuestados</h3>
            <p>{formatCurrency(totalPresupuesto)}</p>
          </div>
          <div className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-semibold mb-2">💰 Balance Final</h3>
            <p className="text-lg font-bold">{formatCurrency(balanceFinal)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
