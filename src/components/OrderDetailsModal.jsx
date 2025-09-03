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
      pendiente: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pendiente' },
      en_proceso: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', label: 'En Proceso' },
      finalizado: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', label: 'Finalizado' },
      entregado: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Entregado' }
    };
    
    const config = statusConfig[status] || statusConfig.pendiente;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} transition-colors duration-200`}>
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
-            <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Orden de Servicio #{order.id}</h2>
+            <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Orden de Servicio</h2>
             <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-200">Creada el {formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors duration-200 flex items-center space-x-2"
              title="Imprimir comprobante"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold transition-colors duration-200"
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
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Información General</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Fecha de Servicio</label>
                  <p className="text-gray-900 dark:text-gray-200 transition-colors duration-200">{formatDate(order.service_date || order.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors duration-200">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Resumen Financiero</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2 transition-colors duration-200">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Total Venta:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 transition-colors duration-200">{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Total Costos:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400 transition-colors duration-200">{formatCurrency(order.total_part_cost || order.totalPartCost || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 transition-colors duration-200">
                  <span className="font-medium text-gray-800 dark:text-gray-200 transition-colors duration-200">Ganancia:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 transition-colors duration-200">{formatCurrency(order.profit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Margen:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200 transition-colors duration-200">
                    {order.total > 0 ? ((order.profit / order.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Descripción del Servicio</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
              <p className="text-gray-900 dark:text-gray-200 whitespace-pre-wrap transition-colors duration-200">{order.description}</p>
            </div>
          </div>

          {/* Ítems */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Detalle de Ítems</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors duration-200">
                <thead className="bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Valor Unitario
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Costo Repuesto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Subtotal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider transition-colors duration-200">
                      Ganancia Ítem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
                  {order.items.map((item, index) => {
                    const subtotal = calculateItemTotal(item);
                    const itemCost = item.partCost * item.quantity;
                    const itemProfit = subtotal - itemCost;
                    
                    return (
                      <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 transition-colors duration-200">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 text-center transition-colors duration-200">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 text-right transition-colors duration-200">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 text-right transition-colors duration-200">
                          {formatCurrency(item.partCost)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400 text-right transition-colors duration-200">
                          {formatCurrency(subtotal)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 text-right transition-colors duration-200">
                          {formatCurrency(itemProfit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-200 text-right transition-colors duration-200">
                      TOTALES:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 text-right transition-colors duration-200">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 text-right transition-colors duration-200">
                      {formatCurrency(order.profit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 transition-colors duration-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 transition-colors duration-200"
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