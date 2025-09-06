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
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal">
      <div className="modal-header">
        <h2>Detalles de la Orden</h2>
        {getStatusBadge(order.estado)}
      </div>

      <div className="modal-body">
        <p><strong>Cliente:</strong> {order.cliente || 'Sin nombre'}</p>
        <p><strong>Fecha:</strong> {formatDateTime(order.fecha)}</p>

        <div className="totales mt-4">
          <p><strong>Ventas:</strong> {formatCurrency(order.ventas)}</p>
          <p><strong>Costos:</strong> {formatCurrency(order.costos)}</p>
          <p><strong>Ganancia:</strong> {formatCurrency(order.ganancia)}</p>
          <p><strong>Pagado:</strong> {formatCurrency(order.pagado)}</p>
          <p><strong>Pendiente:</strong> {formatCurrency(order.pendiente)}</p>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={handlePrint}>🧾 Imprimir Recibo</button>
        <button onClick={onClose}>Cerrar</button>
      </div>

      {showPrintReceipt && (
        <PrintReceipt order={order} onClose={closePrintReceipt} />
      )}
    </div>
  );
};

export default OrderDetailsModal;
