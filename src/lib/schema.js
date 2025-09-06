import { z } from 'zod';

export const itemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  quantity: z.coerce.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.coerce.number().min(0, 'El precio unitario no puede ser negativo'),
  partCost: z.coerce.number().min(0, 'El costo del repuesto no puede ser negativo'),
});

export const paymentSchema = z.object({
  id: z.number().optional(),
  method: z.string().min(1, 'El método de pago es requerido'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a cero'),
});

export const serviceOrderSchema = z.object({
  id: z.number().optional(),
  customer_name: z.string().min(1, 'El nombre del cliente es requerido'),
  description: z.string().optional(),
  service_date: z.string().min(1, 'La fecha de servicio es requerida'),
  status: z.enum(['PENDIENTE','EN PROCESO','FINALIZADO','ENTREGADO']),
  items: z.array(itemSchema).min(1, 'Debe haber al menos un ítem en la orden'),
  payments: z.array(paymentSchema).optional(),
});
