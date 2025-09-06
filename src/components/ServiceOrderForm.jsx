import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceOrderSchema } from '../lib/schema';

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
    } else {
        reset(defaultValues);
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
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        items: data.items?.filter(item => item.description?.trim()) || [],
        payments: data.payments?.filter(payment => payment.amount > 0) || []
      };
      await onSaved?.(cleanedData);
    } catch (error) {
      console.error('❌ Error during form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">{order ? 'Editar Orden' : 'Nueva Orden de Servicio'}</h2>

      <div className="space-y-4">
        <div>
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
            <input
                id="customer_name"
                {...register('customer_name')}
                placeholder="Nombre del cliente"
                className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>}
        </div>

        <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea
                id="description"
                {...register('description')}
                placeholder="Descripción del servicio o equipo"
                className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows="3"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="service_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
                <input
                    id="service_date"
                    {...register('service_date')}
                    type="date"
                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                {errors.service_date && <p className="text-red-500 text-xs mt-1">{errors.service_date.message}</p>}
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                <select
                    id="status"
                    {...register('status')}
                    className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EN PROCESO">En Proceso</option>
                    <option value="FINALIZADO">Finalizado</option>
                    <option value="ENTREGADO">Entregado</option>
                </select>
            </div>
        </div>

        <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Ítems</h3>
            {itemFields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <input
                        {...register(`items.${index}.description`)}
                        placeholder="Descripción del ítem"
                        className="p-2 border rounded-md col-span-1 md:col-span-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        {...register(`items.${index}.quantity`)}
                        type="number"
                        placeholder="Cant."
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        {...register(`items.${index}.unitPrice`)}
                        type="number"
                        step="0.01"
                        placeholder="P. Unitario"
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <div className="flex items-center">
                        <input
                            {...register(`items.${index}.partCost`)}
                            type="number"
                            step="0.01"
                            placeholder="Costo Rep."
                            className="p-2 border rounded-md w-full dark:bg-gray-700 dark:border-gray-600"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                            X
                        </button>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => appendItem({ description: '', quantity: 1, unitPrice: 0, partCost: 0 })}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
                + Ítem
            </button>
        </div>

        <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-white">Pagos</h3>
            {paymentFields.map((payment, index) => (
                <div key={payment.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                    <input
                        {...register(`payments.${index}.method`)}
                        placeholder="Método de pago"
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                        {...register(`payments.${index}.amount`)}
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                        type="button"
                        onClick={() => removePayment(index)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                        Eliminar Pago
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => appendPayment({ method: '', amount: 0 })}
                className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
                + Pago
            </button>
        </div>

        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm space-y-2">
            <div className="flex justify-between"><span>Total Servicio:</span> <span className="font-medium">${calculateTotalServiceCost().toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Total Repuestos:</span> <span className="font-medium">${calculateTotalPartCost().toFixed(2)}</span></div>
            <div className="flex justify-between text-green-600 dark:text-green-400"><span>Total Pagado:</span> <span className="font-medium">${calculateTotalPaid().toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2 dark:border-gray-600"><span>Saldo Pendiente:</span> <span>${(calculateTotalServiceCost() + calculateTotalPartCost() - calculateTotalPaid()).toFixed(2)}</span></div>
        </div>

        <div className="mt-6 flex justify-end">
            <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                {isSubmitting ? 'Guardando...' : 'Guardar Orden'}
            </button>
        </div>
      </div>
    </form>
  );
}