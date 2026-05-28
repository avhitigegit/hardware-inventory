import { z } from 'zod'

export const purchaseItemSchema = z.object({
  product_id: z.number({ error: 'Select a product' }).positive('Select a product'),
  quantity: z.number({ error: 'Enter quantity' }).int().positive('Quantity must be > 0'),
  unit_price: z.number({ error: 'Enter unit price' }).positive('Unit price must be > 0'),
})

export const purchaseSchema = z.object({
  supplier_id: z.number({ error: 'Select a supplier' }).positive('Select a supplier'),
  invoice_number: z.string().optional(),
  payment_type: z.enum(['CASH', 'CREDIT']),
  notes: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
})

export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>
export type PurchaseInput = z.infer<typeof purchaseSchema>
