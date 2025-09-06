import React from 'react';
import { useAppState } from '../hooks/useAppState';

export default function Dashboard() {
  const { state } = useAppState();
  const { orders, isLoading: loading } = state;
  const error = null; // Assuming no error state from context for now

  const summary = (orders || []).reduce((acc, o) => {
    // Calcular total de servicios
    const serviceTotal = (o.items || []).reduce((t, i) => {
      const quantity = Number(i.quantity) || 0;
      const unitPrice = Number(i.unitPrice) || 0;
      return t + (quantity * unitPrice);
    }, 0);
    
    // Calcular total de repuestos
    const partTotal = (o.items || []).reduce((t, i) => {
      const quantity = Number(i.quantity) || 0;
      const partCost = Number(i.partCost) || 0;
      return t + (quantity * partCost);
    }, 0);
    
    // Calcular total pagado
    const totalPaid = (o.payments || []).reduce((t, p) => {
      return t + (Number(p.amount) || 0);
    }, 0);
    
    const orderTotal = serviceTotal + partTotal;
    
    acc.grandTotal += orderTotal;
    acc.serviceTotal += serviceTotal;
    acc.partTotal += partTotal;
    acc.totalPaid += totalPaid;
    acc.pendingAmount += (orderTotal - totalPaid);
    acc.count += 1;
    
    // Contar por estado
    const status = o.status || 'PENDIENTE';
    acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
    
    return acc;
  }, { 
    grandTotal: 0, 
    serviceTotal: 0, 
    partTotal: 0, 
    totalPaid: 0, 
    pendingAmount: 0, 
    count: 0,
    byStatus: {}
  });

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>No se pudieron cargar las órdenes: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard - Resumen de Órdenes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Órdenes</h3>
          <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{summary.count}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Total Facturado</h3>
          <p className="text-3xl font-bold text-green-800 dark:text-green-200">${summary.grandTotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">Total Pagado</h3>
          <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">${summary.totalPaid.toFixed(2)}</p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Saldo Pendiente</h3>
          <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">${summary.pendingAmount.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Desglose de Ingresos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Servicios:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">${summary.serviceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Repuestos:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">${summary.partTotal.toFixed(2)}</span>
            </div>
            <div className="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between font-bold text-gray-900 dark:text-white">
              <span>Total:</span>
              <span>${summary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Órdenes por Estado</h3>
          <div className="space-y-2">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{status}:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
