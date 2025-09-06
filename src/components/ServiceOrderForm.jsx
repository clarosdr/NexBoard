import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { serviceOrderSchema } from '../lib/schema';
import { upsertServiceOrder } from '../lib/serviceOrderService';

export default function ServiceOrderForm({ order, onSaved }) {
  const {
    register, control, handleSubmit, watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(serviceOrderSchema),
    defaultValues: order ?? {
      customer_name: '',
      description: '',
      service_date: new Date().toISOString().slice(0,10),
      status: 'PENDIENTE',
      items: [{ description:'', quantity:'1', unitPrice:'', partCost:'' }],
      payments: []
    }
  });

  const { fields: items, append: appendItem, remove: removeItem } = useFieldArray({ control, name: 'items' });
  const { fields: payments, append: appendPay, remove: removePay } = useFieldArray({ control, name: 'payments' });

  // Cálculos
  const allItems = watch('items');
  const grandTotal = allItems.reduce((sum, i) => sum + (Number(i.quantity)||0)*(Number(i.unitPrice)||0), 0);
  const totalPartCost = allItems.reduce((sum, i) => sum + (Number(i.quantity)||0)*(Number(i.partCost)||0), 0);
  const totalPaid = (watch('payments')||[]).reduce((sum, p) => sum + (Number(p.amount)||0), 0);

  // Cuando cambie "order" inicial, resetea el form
  useEffect(() => { if(order) reset(order); }, [order, reset]);

  const onSubmit = async (data) => {
    try {
      const cleaned = {
        ...data,
        items: data.items.map(i => ({
          ...i,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          partCost: Number(i.partCost)
        })),
        payments: data.payments.map(p => ({
          ...p,
          amount: Number(p.amount)
        }))
      };
      const saved = await upsertServiceOrder(cleaned);
      onSaved(saved);
    } catch (err) {
      console.error(err);
      alert('Error guardando orden: ' + err.message);
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

      <input
        {...register('service_date')}
        type="date"
        className="w-full mb-2 p-2 border rounded"
      />

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
      {items.map((item, index) => (
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
        onClick={() => appendItem({ description: '', quantity: '1', unitPrice: '', partCost: '' })}
        className="mb-4 px-3 py-1 bg-green-500 text-white rounded"
      >
        Agregar Ítem
      </button>

      <h3 className="font-semibold mb-2 mt-4">Pagos</h3>
       {payments.map((payment, index) => (
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
             onClick={() => removePay(index)}
             className="px-2 py-1 bg-red-500 text-white rounded"
           >
             Eliminar
           </button>
         </div>
       ))}
       
       <button
         type="button"
         onClick={() => appendPay({ method: '', amount: '' })}
         className="mb-4 px-3 py-1 bg-green-500 text-white rounded"
       >
         Agregar Pago
       </button>

       <div className="mt-4 p-3 bg-gray-100 rounded">
         <p><strong>Total Servicio:</strong> ${grandTotal.toFixed(2)}</p>
         <p><strong>Total Repuestos:</strong> ${totalPartCost.toFixed(2)}</p>
         <p><strong>Total Pagado:</strong> ${totalPaid.toFixed(2)}</p>
         <p><strong>Saldo Pendiente:</strong> ${(grandTotal + totalPartCost - totalPaid).toFixed(2)}</p>
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
