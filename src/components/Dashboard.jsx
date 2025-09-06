import React, { useEffect, useState } from 'react';
import { fetchServiceOrders } from '../lib/serviceOrderService';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchServiceOrders();
        setOrders(data || []);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = orders.reduce((acc, o) => {
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
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-600">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>No se pudieron cargar las órdenes: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Dashboard - Resumen de Órdenes</h2>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-600 mb-1">Total Órdenes</h3>
          <p className="text-2xl font-bold text-blue-800">{summary.count}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-600 mb-1">Total Facturado</h3>
          <p className="text-2xl font-bold text-green-800">${summary.grandTotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-600 mb-1">Total Pagado</h3>
          <p className="text-2xl font-bold text-purple-800">${summary.totalPaid.toFixed(2)}</p>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-600 mb-1">Saldo Pendiente</h3>
          <p className="text-2xl font-bold text-orange-800">${summary.pendingAmount.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Desglose de totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Desglose de Ingresos</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Servicios:</span>
              <span className="font-medium">${summary.serviceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Repuestos:</span>
              <span className="font-medium">${summary.partTotal.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total:</span>
              <span>${summary.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Órdenes por Estado</h3>
          <div className="space-y-2">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-gray-600">{status}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Lista de órdenes recientes */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Órdenes Recientes</h3>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No hay órdenes registradas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cliente</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Total</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Pagado</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 10).map((order) => {
                  const serviceTotal = (order.items || []).reduce((t, i) => {
                    return t + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0));
                  }, 0);
                  const partTotal = (order.items || []).reduce((t, i) => {
                    return t + ((Number(i.quantity) || 0) * (Number(i.partCost) || 0));
                  }, 0);
                  const totalPaid = (order.payments || []).reduce((t, p) => {
                    return t + (Number(p.amount) || 0);
                  }, 0);
                  const orderTotal = serviceTotal + partTotal;
                  const pending = orderTotal - totalPaid;
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900">{order.customer_name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {order.service_date ? new Date(order.service_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'FINALIZADO' ? 'bg-green-100 text-green-800' :
                          order.status === 'EN PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ENTREGADO' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right font-medium">${orderTotal.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-600">${totalPaid.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-right font-medium ${
                        pending > 0 ? 'text-red-600' : 'text-green-600'
                      }">${pending.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}