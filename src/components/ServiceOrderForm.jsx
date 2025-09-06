import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function ServiceOrderForm({ order, onFormChange }) {
  const [formData, setFormData] = useState(null);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    let initialData;
    if (order) {
      initialData = {
        customer_name: order.customer_name || '',
        description: order.description || '',
        service_date: order.service_date || getTodayLocalDate(),
        status: order.status || 'PENDIENTE',
        items: order.items && order.items.length > 0
          ? order.items.map(item => ({
              ...item,
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              partCost: Number(item.partCost) || 0
            }))
          : [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: order.payments || [],
        totalPaid: Number(order.totalPaid) || 0
      };
    } else {
      initialData = {
        customer_name: '',
        description: '',
        service_date: getTodayLocalDate(),
        status: 'PENDIENTE',
        items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: [],
        totalPaid: 0
      };
    }

    setFormData(initialData);
    setInitialFormData(JSON.parse(JSON.stringify(initialData)));
    setIsSubmitting(false);
    setHasUnsavedChanges(false);
  }, [order]);

  useEffect(() => {
    if (initialFormData) {
      const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasUnsavedChanges(hasChanges);
      if (onFormChange) onFormChange(hasChanges);
    }
  }, [formData, initialFormData, onFormChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'description' ? value : Number(value) || 0;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotalPartCost = () => {
    return formData.items.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const partCost = Number(item.partCost) || 0;
      return total + (quantity * partCost);
    }, 0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const sanitizedItems = formData.items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      partCost: Number(item.partCost) || 0
    }));

    const payload = {
      ...formData,
      items: sanitizedItems,
      grandTotal: calculateGrandTotal(),
      totalPartCost: calculateTotalPartCost()
    };

    const { error } = await supabase.from('ordenes_servicio').insert(payload);
    if (error) console.error('Error al guardar:', error);
    setIsSubmitting(false);
  };

  if (!formData) return null;

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Nueva Orden de Servicio</h2>

      <input
        type="text"
        name="customer_name"
        value={formData.customer_name}
        onChange={handleInputChange}
        placeholder="Cliente"
        className="w-full mb-2 p-2 border rounded"
      />

      <textarea
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        placeholder="Descripción"
        className="w-full mb-2 p-2 border rounded"
      />

      <input
        type="date"
        name="service_date"
        value={formData.service_date}
        onChange={handleInputChange}
        className="w-full mb-2 p-2 border rounded"
      />

      <select
        name="status"
        value={formData.status}
        onChange={handleInputChange}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="PENDIENTE">Pendiente</option>
        <option value="EN PROCESO">En Proceso</option>
        <option value="FINALIZADO">Finalizado</option>
        <option value="ENTREGADO">Entregado</option>
      </select>

      <h3 className="font-semibold mb-2">Ítems</h3>
      {formData.items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            value={item.description}
            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
            placeholder="Descripción"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
            placeholder="Cantidad"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
            placeholder="Precio Unitario"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={item.partCost}
            onChange={(e) => handleItemChange(index, 'partCost', e.target.value)}
            placeholder="Costo Repuesto"
            className="p-2 border rounded"
          />
        </div>
      ))}

      <div className="mt-4">
        <p><strong>Total Servicio:</strong> ${calculateGrandTotal()}</p>
        <p><strong>Total Repuestos:</strong> ${calculateTotalPartCost()}</p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
      </button>
    </div>
  );
}
