import { z } from 'zod'

export const stockAdjustmentSchema = z.object({
  product_id: z.number({ error: 'Select a product' }).positive('Select a product'),
  adjustment_type: z.enum(['ADD', 'SUBTRACT']),
  quantity: z.number({ error: 'Enter quantity' }).int().positive('Quantity must be > 0'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>
