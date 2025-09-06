import React, { useState } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAuth } from '../hooks/useAuth';
import OrderDetailsModal from './OrderDetailsModal';
import Button from './ui/Button';

const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const ServiceOrdersTable = () => {
  const { state, actions } = useAppState();
  const { user } = useAuth();
  const { orders, isLoading: loading } = state;
  const [selectedOrder, setSelectedOrder] = useState(null);

  const openModal = (order) => {
    setSelectedOrder(order);
  };

  const closeModal = () => {
    setSelectedOrder(null);
  };
  
  const handleRefresh = () => {
      if(user?.id) {
          actions.loadOrders(user.id);
      }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      'EN PROCESO': "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      FINALIZADO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      ENTREGADO: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[status] || statusMap.PENDIENTE}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Listado de Órdenes</h2>
        <Button onClick={handleRefresh} disabled={loading} variant="secondary" size="sm">
          🔄 Recargar
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-4">Cargando órdenes...</p>
      ) : !orders || orders.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No hay órdenes de servicio registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">Fecha</th>
                <th scope="col" className="px-6 py-3">Estado</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-6 py-3 text-right">Pagado</th>
                <th scope="col" className="px-6 py-3 text-right">Pendiente</th>
                <th scope="col" className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                  const serviceTotal = (order.items || []).reduce((t, i) => t + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
                  const partTotal = (order.items || []).reduce((t, i) => t + ((Number(i.quantity) || 0) * (Number(i.partCost) || 0)), 0);
                  const totalPaid = (order.payments || []).reduce((t, p) => t + (Number(p.amount) || 0), 0);
                  const orderTotal = serviceTotal + partTotal;
                  const pending = orderTotal - totalPaid;
                  
                  return (
                     <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{order.customer_name}</td>
                        <td className="px-6 py-4">{new Date(order.service_date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(orderTotal)}</td>
                        <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</td>
                        <td className={`px-6 py-4 text-right font-medium ${pending > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-500'}`}>{formatCurrency(pending)}</td>
                        <td className="px-6 py-4 text-center space-x-2">
                           <Button onClick={() => openModal(order)} variant="link" size="sm">Ver</Button>
                           <Button onClick={() => actions.setEditingOrder(order)} variant="link" size="sm">Editar</Button>
                        </td>
                     </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ServiceOrdersTable;
