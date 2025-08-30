import React, { useState } from 'react';
import PrintReceipt from './PrintReceipt';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);

  const handlePrint = () => {
    setShowPrintReceipt(true);
  };

  const closePrintReceipt = () => {
    setShowPrintReceipt(false);
  };

  if (!isOpen || !order) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      en_proceso: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'En Proceso' },
      finalizado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Finalizado' },
      entregado: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Entregado' }
    };
    
    const config = statusConfig[status] || statusConfig.pendiente;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateItemTotal = (item) => {
    return item.quantity * item.unitPrice;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Orden de Servicio #{order.id}</h2>
            <p className="text-gray-600 mt-1">Creada el {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center space-x-2"
              title="Imprimir comprobante"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Información General</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Fecha de Servicio</label>
                  <p className="text-gray-900">{formatDate(order.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen Financiero</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Venta:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Costos:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(order.totalPartCost)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium text-gray-800">Ganancia:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(order.profit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margen:</span>
                  <span className="font-medium">
                    {order.total > 0 ? ((order.profit / order.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Descripción del Servicio</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-900 whitespace-pre-wrap">{order.description}</p>
            </div>
          </div>

          {/* Ítems */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalle de Ítems</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Unitario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Costo Repuesto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ganancia Ítem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => {
                    const subtotal = calculateItemTotal(item);
                    const itemCost = item.partCost * item.quantity;
                    const itemProfit = subtotal - itemCost;
                    
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(item.partCost)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 text-right">
                          {formatCurrency(itemProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      TOTALES:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                      {formatCurrency(order.profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
      
      {showPrintReceipt && (
        <PrintReceipt
          order={order}
          onClose={closePrintReceipt}
        />
      )}
    </div>
  );
};

export default OrderDetailsModal;