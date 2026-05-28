import { z } from 'zod'

export const saleItemSchema = z.object({
  product_id: z.number().positive(),
  product_name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
})

export const saleSchema = z.object({
  customer_id: z.number().positive().optional().nullable(),
  payment_type: z.enum(['CASH', 'CREDIT']),
  amount_received: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'Cart is empty'),
})

export type SaleItemInput = z.infer<typeof saleItemSchema>
export type SaleInput = z.infer<typeof saleSchema>
