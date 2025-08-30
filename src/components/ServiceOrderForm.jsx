import { useState, useEffect } from 'react';

// Función para formatear valores en pesos colombianos
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const ServiceOrderForm = ({ order, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pendiente',
    items: [{
      id: 1,
      description: '',
      quantity: 1,
      unitPrice: 0,
      partCost: 0
    }],
    payments: [],
    totalPaid: 0
  });

  // Cargar datos de la orden si estamos editando
  useEffect(() => {
    if (order) {
      const payments = order.payments || [];
      const calculatedTotalPaid = payments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0);
      
      setFormData({
        customerName: order.customerName || '',
        description: order.description,
        date: order.date,
        status: order.status,
        items: order.items.map(item => ({ ...item })),
        payments: payments,
        totalPaid: calculatedTotalPaid
      });
    } else {
      // Reset form for new order
      setFormData({
        customerName: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        items: [{
          id: 1,
          description: '',
          quantity: 1,
          unitPrice: 0,
          partCost: 0
        }],
        payments: [],
        totalPaid: 0
      });
    }
  }, [order]);



  const statusOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_proceso', label: 'En Proceso' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'entregado', label: 'Entregado' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, [field]: field === 'quantity' || field === 'unitPrice' || field === 'partCost' ? parseFloat(value) || 0 : value }
          : item
      )
    }));
  };

  const addItem = () => {
    const newId = Math.max(...formData.items.map(item => item.id)) + 1;
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: newId,
        description: '',
        quantity: 1,
        unitPrice: 0,
        partCost: 0
      }]
    }));
  };

  const removeItem = (itemId) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
    }
  };

  const calculateItemTotal = (item) => {
    return item.quantity * item.unitPrice;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  const calculateTotalPartCost = () => {
    return formData.items.reduce((total, item) => total + (item.partCost * item.quantity), 0);
  };

  const calculateProfit = () => {
    return calculateGrandTotal() - calculateTotalPartCost();
  };

  const calculatePendingBalance = () => {
    return calculateGrandTotal() - formData.totalPaid;
  };

  const addPayment = () => {
    const newPayment = {
      id: Date.now(),
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment]
    }));
  };

  const removePayment = (paymentId) => {
    setFormData(prev => {
      const updatedPayments = prev.payments.filter(payment => payment.id !== paymentId);
      const totalPaid = updatedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
      
      return {
        ...prev,
        payments: updatedPayments,
        totalPaid
      };
    });
  };

  const handlePaymentChange = (paymentId, field, value) => {
    setFormData(prev => {
      const updatedPayments = prev.payments.map(payment => 
        payment.id === paymentId 
          ? { ...payment, [field]: field === 'amount' ? (value === '' ? 0 : Number(value)) : value }
          : payment
      );
      
      // Si se cambió el monto, recalcular totalPaid inmediatamente
      const totalPaid = field === 'amount' 
        ? updatedPayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
        : prev.totalPaid;
      
      return {
        ...prev,
        payments: updatedPayments,
        totalPaid
      };
    });
  };

  const updateTotalPaid = () => {
    setFormData(prev => {
      const total = prev.payments.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0);
      return {
        ...prev,
        totalPaid: total
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      id: order ? order.id : Date.now(),
      createdAt: order ? order.createdAt : new Date().toISOString(),
      total: calculateGrandTotal(),
      totalPartCost: calculateTotalPartCost(),
      profit: calculateProfit(),
      pendingBalance: calculatePendingBalance()
    };
    onSubmit(orderData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {order ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Servicio *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation resize-none"
                placeholder="Describe el problema o servicio a realizar..."
              />
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ítems */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Ítems de Venta</h3>
            <button
              type="button"
              onClick={addItem}
              className="px-6 py-3 text-base bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 touch-manipulation min-h-[44px]"
            >
              + Agregar Ítem
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Ítem {index + 1}</h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg touch-manipulation min-h-[40px]"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Descripción *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      required
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                      placeholder="Descripción del ítem"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Valor Unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Costo Repuesto
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.partCost}
                      onChange={(e) => handleItemChange(item.id, 'partCost', e.target.value)}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation"
                    />
                  </div>
                </div>
                
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium text-gray-700">
                    Subtotal: {formatCurrency(calculateItemTotal(item))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Abonos - Visible cuando el estado es 'finalizado' o 'entregado' */}
        {(formData.status === 'finalizado' || formData.status === 'entregado') && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-blue-800">Gestión de Abonos</h3>
              {formData.status === 'finalizado' && (
                <button
                  type="button"
                  onClick={addPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  + Agregar Abono
                </button>
              )}
            </div>
            
            {formData.payments.length > 0 && (
              <div className="space-y-3 mb-4">
                {formData.payments.map((payment) => (
                  <div key={payment.id} className="bg-white p-3 rounded-md border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Monto del Abono
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                          disabled={formData.status === 'entregado'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Fecha del Abono
                        </label>
                        <input
                          type="date"
                          value={payment.date}
                          onChange={(e) => handlePaymentChange(payment.id, 'date', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={formData.status === 'entregado'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Notas (Opcional)
                        </label>
                        <input
                          type="text"
                          value={payment.notes}
                          onChange={(e) => handlePaymentChange(payment.id, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Efectivo, transferencia, etc."
                          disabled={formData.status === 'entregado'}
                        />
                      </div>
                      <div className="flex items-end">
                        {formData.status === 'finalizado' && (
                          <button
                            type="button"
                            onClick={() => removePayment(payment.id)}
                            className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Eliminar
                          </button>
                        )}
                        {formData.status === 'entregado' && (
                          <div className="w-full px-3 py-2 bg-gray-100 text-gray-500 rounded-md text-center">
                            Orden Entregada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-white p-3 rounded-md border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Total Abonado:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {formatCurrency(formData.totalPaid)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Saldo Pendiente:</span>
                  <span className={`ml-2 text-lg font-bold ${
                    calculatePendingBalance() > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(calculatePendingBalance())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Total Venta:</span>
              <span className="ml-2 text-lg font-bold text-green-600">
                {formatCurrency(calculateGrandTotal())}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Costos:</span>
              <span className="ml-2 text-lg font-bold text-red-600">
                {formatCurrency(calculateTotalPartCost())}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Ganancia:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                {formatCurrency(calculateProfit())}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-4 text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation min-h-[48px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-4 text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-manipulation min-h-[48px] font-medium"
          >
            Guardar Orden
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceOrderForm;