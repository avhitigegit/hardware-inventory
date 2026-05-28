import { z } from 'zod'

const UNITS = ['PCS', 'KG', 'MTR', 'LTR', 'BOX', 'PACK'] as const

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  description: z.string().optional(),
  category_id: z.number({ error: 'Select a category' }).positive('Select a category'),
  supplier_id: z.number().optional().nullable(),
  unit: z.enum(UNITS, { error: 'Select a unit' }),
  buying_price: z.number({ error: 'Enter buying price' }).positive('Buying price must be > 0'),
  selling_price: z.number({ error: 'Enter selling price' }).positive('Selling price must be > 0'),
  reorder_level: z.number({ error: 'Enter reorder level' }).int().min(0, 'Must be 0 or more'),
  is_active: z.boolean(),
})

export const productCreateSchema = productSchema.extend({
  initial_stock: z.number({ error: 'Enter initial stock' }).int().min(0, 'Must be 0 or more'),
})

export type ProductInput = z.infer<typeof productSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>

export const PRODUCT_UNITS = UNITS
