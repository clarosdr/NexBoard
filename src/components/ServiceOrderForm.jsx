import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceOrderSchema } from '../lib/schema';
import { upsertServiceOrder } from '../lib/serviceOrderService';

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ServiceOrderForm({ order, onSaved }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultValues = {
    customer_name: order?.customer_name || '',
    description: order?.description || '',
    service_date: order?.service_date || getTodayLocalDate(),
    status: order?.status || 'PENDIENTE',
    items: order?.items?.length > 0 
      ? order.items.map(item => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0,
          partCost: Number(item.partCost) || 0
        }))
      : [{ description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
    payments: order?.payments || []
  };

  const { register, control, handleSubmit, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items'
  });

  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control,
    name: 'payments'
  });

  const watchedItems = watch('items');
  const watchedPayments = watch('payments');

  // Reset form when order changes
  useEffect(() => {
    if (order) {
      const resetData = {
        customer_name: order.customer_name || '',
        description: order.description || '',
        service_date: order.service_date || getTodayLocalDate(),
        status: order.status || 'PENDIENTE',
        items: order.items?.length > 0 
          ? order.items.map(item => ({
              ...item,
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              partCost: Number(item.partCost) || 0
            }))
          : [{ description: '', quantity: 1, unitPrice: 0, partCost: 0 }],
        payments: order.payments || []
      };
      reset(resetData);
    }
  }, [order, reset]);

  // Calculations based on watched values
  const calculateTotalServiceCost = () => {
    if (!Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((total, item) => {
      const quantity = Number(item?.quantity) || 0;
      const unitPrice = Number(item?.unitPrice) || 0;
      return total + (quantity * unitPrice);
    }, 0);
  };

  const calculateTotalPartCost = () => {
    if (!Array.isArray(watchedItems)) return 0;
    return watchedItems.reduce((total, item) => {
      const quantity = Number(item?.quantity) || 0;
      const partCost = Number(item?.partCost) || 0;
      return total + (quantity * partCost);
    }, 0);
  };

  const calculateTotalPaid = () => {
    if (!Array.isArray(watchedPayments)) return 0;
    return watchedPayments.reduce((total, payment) => {
      const amount = Number(payment?.amount) || 0;
      return total + amount;
    }, 0);
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const cleanedData = {
        ...data,
        items: data.items?.filter(item => item.description?.trim()) || [],
        payments: data.payments?.filter(payment => payment.amount > 0) || []
      };
      
      const result = await upsertServiceOrder(cleanedData, order?.id);
      onSaved?.(result);
      
    } catch (error) {
      console.error('❌ Error saving order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-white rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">{order ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h2>

      <input
        {...register('customer_name')}
        placeholder="Cliente"
        className="w-full mb-2 p-2 border rounded"
      />
      {errors.customer_name && <p className="text-red-500 text-sm">{errors.customer_name.message}</p>}

      <textarea
        {...register('description')}
        placeholder="Descripción"
        className="w-full mb-2 p-2 border rounded"
      />
      {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}

      <input
        {...register('service_date')}
        type="date"
        className="w-full mb-2 p-2 border rounded"
      />
      {errors.service_date && <p className="text-red-500 text-sm">{errors.service_date.message}</p>}

      <select
        {...register('status')}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="PENDIENTE">Pendiente</option>
        <option value="EN PROCESO">En Proceso</option>
        <option value="FINALIZADO">Finalizado</option>
        <option value="ENTREGADO">Entregado</option>
      </select>

      <h3 className="font-semibold mb-2">Ítems</h3>
      {itemFields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-5 gap-2 mb-2">
          <input
            {...register(`items.${index}.description`)}
            placeholder="Descripción"
            className="p-2 border rounded"
          />
          <input
            {...register(`items.${index}.quantity`)}
            type="number"
            placeholder="Cantidad"
            className="p-2 border rounded"
          />
          <input
            {...register(`items.${index}.unitPrice`)}
            type="number"
            step="0.01"
            placeholder="Precio Unitario"
            className="p-2 border rounded"
          />
          <input
            {...register(`items.${index}.partCost`)}
            type="number"
            step="0.01"
            placeholder="Costo Repuesto"
            className="p-2 border rounded"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            className="px-2 py-1 bg-red-500 text-white rounded"
          >
            Eliminar
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => appendItem({ description: '', quantity: 1, unitPrice: 0, partCost: 0 })}
        className="mb-4 px-3 py-1 bg-green-500 text-white rounded"
      >
        Agregar Ítem
      </button>

      <h3 className="font-semibold mb-2 mt-4">Pagos</h3>
      {paymentFields.map((payment, index) => (
        <div key={payment.id} className="grid grid-cols-3 gap-2 mb-2">
          <input
            {...register(`payments.${index}.method`)}
            placeholder="Método de pago"
            className="p-2 border rounded"
          />
          <input
            {...register(`payments.${index}.amount`)}
            type="number"
            step="0.01"
            placeholder="Monto"
            className="p-2 border rounded"
          />
          <button
            type="button"
            onClick={() => removePayment(index)}
            className="px-2 py-1 bg-red-500 text-white rounded"
          >
            Eliminar
          </button>
        </div>
      ))}
      
      <button
        type="button"
        onClick={() => appendPayment({ method: '', amount: 0 })}
        className="mb-4 px-3 py-1 bg-green-500 text-white rounded"
      >
        Agregar Pago
      </button>

      <div className="mt-4 p-3 bg-gray-100 rounded">
        <p><strong>Total Servicio:</strong> ${calculateTotalServiceCost().toFixed(2)}</p>
        <p><strong>Total Repuestos:</strong> ${calculateTotalPartCost().toFixed(2)}</p>
        <p><strong>Total Pagado:</strong> ${calculateTotalPaid().toFixed(2)}</p>
        <p><strong>Saldo Pendiente:</strong> ${(calculateTotalServiceCost() + calculateTotalPartCost() - calculateTotalPaid()).toFixed(2)}</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
      </button>
    </form>
  );
}
