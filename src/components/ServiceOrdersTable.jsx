import React, { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import OrderDetailsModal from './OrderDetailsModal';

const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseInt(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const ServiceOrdersTable = () => {
  const { orders, loading, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setModalOpen(false);
  };

  return (
    <div className="orders-table p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📋 Órdenes de Servicio</h2>
        <button
          onClick={refetch}
          className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          🔄 Recargar
        </button>
      </div>

      {loading ? (
        <p>Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <p>No hay órdenes registradas.</p>
      ) : (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-right">Ventas</th>
              <th className="px-4 py-2 text-right">Ganancia</th>
              <th className="px-4 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-4 py-2">{order.id}</td>
                <td className="px-4 py-2">{order.cliente}</td>
                <td className="px-4 py-2">{order.estado}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(order.ventas)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(order.ganancia)}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openModal(order)}
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={modalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default ServiceOrdersTable;
