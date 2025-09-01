import React from 'react';

const PrintReceipt = ({ order, onClose }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'finalizado': 'Finalizado',
      'entregado': 'Entregado'
    };
    return statusMap[status] || status;
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        {/* Header con botones - Solo visible en pantalla */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 print:hidden transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white transition-colors duration-200">Comprobante de Servicio</h2>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 dark:bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Contenido del comprobante */}
        <div className="p-8 print:p-4">
          {/* Encabezado de la empresa */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white print:text-2xl transition-colors duration-200">NexBoard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-200">Sistema de Gestión de Órdenes de Servicio</p>
            <div className="border-b-2 border-gray-300 dark:border-gray-600 mt-4 transition-colors duration-200"></div>
          </div>

          {/* Información del comprobante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Información de la Orden</h3>
              <div className="space-y-2 text-gray-700 dark:text-gray-300 transition-colors duration-200">
                <p><span className="font-medium">Orden N°:</span> {order.id}</p>
                <p><span className="font-medium">Fecha:</span> {formatDate(order.date)}</p>
                <p><span className="font-medium">Estado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusText(order.status)}
                  </span>
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Cliente</h3>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">{order.customer_name}</p>
              </div>
            </div>
          </div>

          {/* Descripción del servicio */}
          <div className="mb-8 print:mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Descripción del Servicio</h3>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg print:bg-white print:border transition-colors duration-200">
              <p className="text-gray-700 dark:text-gray-300 transition-colors duration-200">{order.description}</p>
            </div>
          </div>

          {/* Tabla de items */}
          {order.items && order.items.length > 0 && (
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">Detalle de Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 transition-colors duration-200">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 print:bg-gray-100 transition-colors duration-200">
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-800 dark:text-white transition-colors duration-200">Descripción</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-800 dark:text-white transition-colors duration-200">Cantidad</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-white transition-colors duration-200">Precio Unit.</th>
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-800 dark:text-white transition-colors duration-200">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, index) => {
                      const subtotal = item.quantity * item.unitPrice;
                      return (
                        <tr key={index} className="bg-white dark:bg-gray-800 transition-colors duration-200">
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 transition-colors duration-200">{item.description}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-center text-gray-700 dark:text-gray-300 transition-colors duration-200">{item.quantity}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-700 dark:text-gray-300 transition-colors duration-200">{formatCurrency(item.unitPrice)}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-700 dark:text-gray-300 transition-colors duration-200">{formatCurrency(subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Resumen financiero */}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-6 transition-colors duration-200">
            <div className="flex justify-end">
              <div className="w-full max-w-sm">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-t border-gray-200 dark:border-gray-600 pt-4 transition-colors duration-200">
                    <span className="font-bold text-lg text-gray-800 dark:text-white transition-colors duration-200">TOTAL A PAGAR:</span>
                    <span className="font-bold text-xl text-blue-600 dark:text-blue-400 transition-colors duration-200">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie del comprobante */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600 text-center text-sm text-gray-600 dark:text-gray-400 print:mt-6 transition-colors duration-200">
            <p>Gracias por confiar en nuestros servicios</p>
            <p className="mt-2">Este comprobante fue generado el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}</p>
          </div>
        </div>
      </div>

      {/* Estilos específicos para impresión */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:mt-6 {
            margin-top: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintReceipt;