import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function ServiceOrderForm({ order, onFormChange }) {
  const [formData, setFormData] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  useEffect(() => {
    const initialData = order
      ? {
          customer_name: order.customer_name || '',
          description: order.description || '',
          service_date: order.service_date || getTodayLocalDate(),
          status: order.status || 'PENDIENTE',
          items: order.items?.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            partCost: Number(item.partCost) || 0,
          })) || [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
          totalPaid: Number(order.totalPaid) || 0,
        }
      : {
          customer_name: '',
          description: '',
          service_date: getTodayLocalDate(),
          status: 'PENDIENTE',
          items: [{ id: 1, description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
          totalPaid: 0,
        };

    setFormData(initialData);
    setInitialFormData(JSON.parse(JSON.stringify(initialData)));
  }, [order]);

  useEffect(() => {
    if (!initialFormData) return;
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    onFormChange?.(hasChanges);
  }, [formData, initialFormData, onFormChange]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'description' ? value : Number(value);
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const calculateGrandTotal = () =>
    formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const calculateTotalPartCost = () =>
    formData.items.reduce((sum, item) => sum + item.quantity * item.partCost, 0);

  const validateForm = () => {
    const errors = {};
    if (!formData.customer_name.trim()) errors.customer_name = 'El nombre del cliente es obligatorio.';
    if (!formData.description.trim()) errors.description = 'La descripción es obligatoria.';
    if (!formData.service_date) errors.service_date = 'La fecha es obligatoria.';

    formData.items.forEach((item, idx) => {
      if (!item.description.trim()) errors[`item_${idx}_description`] = 'Descripción requerida.';
      if (item.quantity <= 0) errors[`item_${idx}_quantity`] = 'Cantidad debe ser mayor a 0.';
      if (item.unitPrice < 0) errors[`item_${idx}_unitPrice`] = 'Precio no puede ser negativo.';
      if (item.partCost < 0) errors[`item_${idx}_partCost`] = 'Costo no puede ser negativo.';
    });

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    const payload = {
      ...formData,
      items: formData.items.map(item => ({
        ...item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        partCost: item.partCost,
      })),
      grandTotal: calculateGrandTotal(),
      totalPartCost: calculateTotalPartCost(),
    };

    const { error } = await supabase.from('ordenes_servicio').insert(payload);
    if (error) console.error('Error al guardar:', error.message);
    setIsSubmitting(false);
  };

  if (!formData) return null;

  return (
    <div className="bg-white shadow rounded p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Nueva Orden de Servicio</h2>

      <div className="mb-4">
        <input
          type="text"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleInputChange}
          placeholder="Cliente"
          className={`w-full p-2 border rounded ${formErrors.customer_name ? 'border-red-500' : ''}`}
        />
        {formErrors.customer_name && (
          <p className="text-red-500 text-sm mt-1">{formErrors.customer_name}</p>
        )}
      </div>

      <div className="mb-4">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Descripción"
          className={`w-full p-2 border rounded ${formErrors.description ? 'border-red-500' : ''}`}
        />
        {formErrors.description && (
          <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <input
            type="date"
            name="service_date"
            value={formData.service_date}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${formErrors.service_date ? 'border-red-500' : ''}`}
          />
          {formErrors.service_date && (
            <p className="text-red-500 text-sm mt-1">{formErrors.service_date}</p>
          )}
        </div>
        <div>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN PROCESO">En Proceso</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="ENTREGADO">Entregado</option>
          </select>
        </div>
      </div>

      <h3 className="font-semibold mb-2">Ítems</h3>
      {formData.items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <input
              type="text"
              value={item.description}
              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
              placeholder="Descripción"
              className={`w-full p-2 border rounded ${
                formErrors[`item_${idx}_description`] ? 'border-red-500' : ''
              }`}
            />
            {formErrors[`item_${idx}_description`] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors[`item_${idx}_description`]}
              </p>
            )}
          </div>
          <div>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
              placeholder="Cantidad"
              className={`w-full p-2 border rounded ${
                formErrors[`item_${idx}_quantity`] ? 'border-red-500' : ''
              }`}
            />
            {formErrors[`item_${idx}_quantity`] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors[`item_${idx}_quantity`]}
              </p>
            )}
          </div>
          <div>
            <input
              type="number"
              value={item.unitPrice}
              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
              placeholder="Precio Unitario"
              className={`w-full p-2 border rounded ${
                formErrors[`item_${idx}_unitPrice`] ? 'border-red-500' : ''
              }`}
            />
            {formErrors[`item_${idx}_unitPrice`] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors[`item_${idx}_unitPrice`]}
              </p>
            )}
          </div>
          <div>
            <input
              type="number"
              value={item.partCost}
              onChange={(e) => handleItemChange(idx, 'partCost', e.target.value)}
              placeholder="Costo Repuesto"
              className={`w-full p-2 border rounded ${
                formErrors[`item_${idx}_partCost`] ? 'border-red-500' : ''
              }`}
            />
            {formErrors[`item_${idx}_partCost`] && (
              <p className="text-red-500 text-sm mt-1">
                {formErrors[`item_${idx}_partCost`]}
              </p>
            )}
          </div>
        </div>
      ))}

      <div className="mb-4">
        <p>
          <strong>Total Servicio: </strong>${calculateGrandTotal()}
        </p>
        <p>
          <strong>Total Repuestos: </strong>${calculateTotalPartCost()}
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded text-white ${
          isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
      </button>
    </div>
  );
}
