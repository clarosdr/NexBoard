import React, { useState } from 'react';
import PrintReceipt from './PrintReceipt';

// Formateador de moneda
const formatCurrency = (value) => {
  const parsed = typeof value === 'number' ? value : parseInt(value) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);

  const handlePrint = () => setShowPrintReceipt(true);
  const closePrintReceipt = () => setShowPrintReceipt(false);

  if (!isOpen || !order) return null;

  // 🔍 Log para depuración
  console.log('🧾 Datos de la orden recibida:', order);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendiente: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        label: 'Pendiente',
      },
      en_proceso: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        label: 'En Proceso',
      },
      finalizado: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        label: 'Finalizado',
      },
      entregado: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-300',
        label: 'Entregado',
      },
    };

    const config = statusConfig[status] || statusConfig.pendiente;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">Detalles de la Orden</h2>
            <p className="text-sm text-gray-500">Cliente: {order.cliente || order.customer_name || 'Sin nombre'}</p>
          </div>
          {getStatusBadge(order.estado || order.status)}
        </div>

        <div className="space-y-4">
          <p><strong>Fecha:</strong> {formatDateTime(order.fecha || order.service_date)}</p>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <h3 className="font-semibold mb-2">Descripción</h3>
            <p>{order.description || 'Sin descripción'}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            {order.items && order.items.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {order.items.map((item, index) => (
                  <li key={index}>
                    {item.description} ({item.quantity} x {formatCurrency(item.unitPrice)}) = {formatCurrency(item.quantity * item.unitPrice)}
                  </li>
                ))}
              </ul>
            ) : <p>No hay items.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-600">
            <p><strong>Ventas:</strong> {formatCurrency(order.ventas || order.total)}</p>
            <p><strong>Costos:</strong> {formatCurrency(order.costos || 0)}</p>
            <p><strong>Ganancia:</strong> {formatCurrency(order.ganancia || 0)}</p>
            <p><strong>Pagado:</strong> {formatCurrency(order.pagado || 0)}</p>
            <p className="font-bold"><strong>Pendiente:</strong> {formatCurrency(order.pendiente || 0)}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">🧾 Imprimir Recibo</button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500">Cerrar</button>
        </div>

        {showPrintReceipt && (
          <PrintReceipt order={order} onClose={closePrintReceipt} />
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
