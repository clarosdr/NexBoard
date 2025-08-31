import { useState, useEffect } from 'react';

// Función para generar UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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
        description: order.description || '',
        date: order.date || new Date().toISOString().split('T')[0],
        status: order.status || 'pendiente',
        items: order.items && order.items.length > 0 ? order.items.map(item => ({ ...item })) : [{
          id: 1,
          description: '',
          quantity: 1,
          unitPrice: 0,
          partCost: 0
        }],
        payments: payments.map(payment => ({ ...payment })),
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
    setIsSubmitting(false);
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

  const addPayment = () => {
    const newId = formData.payments.length > 0 ? Math.max(...formData.payments.map(p => p.id)) + 1 : 1;
    const newPayment = {
      id: newId,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      method: 'efectivo',
      description: ''
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

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTotalPartCost = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.partCost);
    }, 0);
  };

  const calculateProfit = () => {
    return calculateGrandTotal() - calculateTotalPartCost();
  };

  const calculatePendingBalance = () => {
    const total = calculateGrandTotal();
    const paid = formData.totalPaid;
    return Math.max(0, total - paid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validaciones básicas
    if (!formData.customerName.trim()) {
      alert('El nombre del cliente es requerido');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('La descripción del servicio es requerida');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...formData,
        id: order ? order.id : generateUUID(),
        createdAt: order ? order.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        total: calculateGrandTotal(),
        totalPartCost: calculateTotalPartCost(),
        profit: calculateProfit(),
        pendingBalance: calculatePendingBalance(),
        // Asegurar que customerName se preserve
        customerName: formData.customerName.trim()
      };
      
      await onSubmit(orderData);
    } catch (error) {
      console.error('Error submitting order:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors duration-200">
          {order ? 'Editar Orden de Servicio' : 'Nueva Orden de Servicio'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
          disabled={isSubmitting}
        >
          ✕
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                Cliente *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50"
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                Descripción del Servicio *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
                rows={3}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 touch-manipulation resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50"
                placeholder="Describe el problema o servicio a realizar..."
              />
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 touch-manipulation bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
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

        {/* Items/Servicios */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white transition-colors duration-200">
              Items/Servicios
            </h3>
            <button
              type="button"
              onClick={addItem}
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50"
            >
              + Agregar Item
            </button>
          </div>
          
          <div className="space-y-4">
            {formData.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-colors duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-800 dark:text-white transition-colors duration-200">
                    Item #{index + 1}
                  </h4>
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isSubmitting}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50"
                      placeholder="Descripción del item"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      min="1"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Precio Unitario
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                      min="0"
                      step="100"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                      Costo de Partes
                    </label>
                    <input
                      type="number"
                      value={item.partCost}
                      onChange={(e) => handleItemChange(item.id, 'partCost', e.target.value)}
                      min="0"
                      step="100"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                    />
                  </div>
                </div>
                
                <div className="mt-3 text-right">
                  <span className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
                    Subtotal: <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagos */}
        {(formData.status === 'finalizado' || formData.status === 'entregado') && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white transition-colors duration-200">
                Pagos Recibidos
              </h3>
              <button
                type="button"
                onClick={addPayment}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
              >
                + Agregar Pago
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.payments.map((payment, index) => (
                <div key={payment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-colors duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-800 dark:text-white transition-colors duration-200">
                      Pago #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removePayment(payment.id)}
                      disabled={isSubmitting}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors duration-200 disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={payment.date}
                        onChange={(e) => handlePaymentChange(payment.id, 'date', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Monto
                      </label>
                      <input
                        type="number"
                        value={payment.amount}
                        onChange={(e) => handlePaymentChange(payment.id, 'amount', e.target.value)}
                        min="0"
                        step="100"
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Método
                      </label>
                      <select
                        value={payment.method}
                        onChange={(e) => handlePaymentChange(payment.id, 'method', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 disabled:opacity-50"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-200">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={payment.description}
                        onChange={(e) => handlePaymentChange(payment.id, 'description', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200 disabled:opacity-50"
                        placeholder="Descripción del pago"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg transition-colors duration-200">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 transition-colors duration-200">
            Resumen Financiero
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Total:</span>
              <div className="font-semibold text-green-600 dark:text-green-400 transition-colors duration-200">
                {formatCurrency(calculateGrandTotal())}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Costos:</span>
              <div className="font-semibold text-red-600 dark:text-red-400 transition-colors duration-200">
                {formatCurrency(calculateTotalPartCost())}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Ganancia:</span>
              <div className="font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-200">
                {formatCurrency(calculateProfit())}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Pagado:</span>
              <div className="font-semibold text-teal-600 dark:text-teal-400 transition-colors duration-200">
                {formatCurrency(formData.totalPaid)}
              </div>
            </div>
          </div>
          {calculatePendingBalance() > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400 transition-colors duration-200">Saldo Pendiente:</span>
              <div className="font-semibold text-orange-600 dark:text-orange-400 transition-colors duration-200">
                {formatCurrency(calculatePendingBalance())}
              </div>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? 'Guardando...' : (order ? 'Actualizar' : 'Crear')} Orden
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceOrderForm;