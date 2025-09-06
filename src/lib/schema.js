import { z } from 'zod';

export const itemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.string().regex(/^\d+$/, 'Cantidad debe ser número'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Precio inválido'),
  partCost: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Costo inválido'),
});

export const paymentSchema = z.object({
  id: z.number().optional(),
  method: z.string().min(1, 'Método requerido'),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
});

export const serviceOrderSchema = z.object({
  id: z.number().optional(),
  customer_name: z.string().min(1, 'Cliente requerido'),
  description: z.string().optional(),
  service_date: z.string().min(1, 'Fecha requerida'),
  status: z.enum(['PENDIENTE','EN PROCESO','FINALIZADO','ENTREGADO']),
  items: z.array(itemSchema).min(1, 'Debe haber al menos un ítem'),
  payments: z.array(paymentSchema).optional(),
});