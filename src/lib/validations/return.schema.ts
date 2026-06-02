import { z } from 'zod'

export const returnItemSchema = z.object({
  product_id: z.number().positive(),
  product_name: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
})

export const returnSchema = z.object({
  sale_id: z.number().positive().optional().nullable(),
  customer_id: z.number().positive().optional().nullable(),
  return_method: z.enum(['CASH_REFUND', 'CREDIT_ADJUSTMENT']),
  notes: z.string().optional(),
  items: z.array(returnItemSchema).min(1, 'Add at least one item'),
})

export type ReturnItemInput = z.infer<typeof returnItemSchema>
export type ReturnInput = z.infer<typeof returnSchema>
