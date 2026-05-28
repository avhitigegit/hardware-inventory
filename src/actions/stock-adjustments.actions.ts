'use server'

import { createClient } from '@/lib/supabase/server'
import { stockAdjustmentSchema, type StockAdjustmentInput } from '@/lib/validations/stock-adjustment.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 20

export async function getStockAdjustments(filters?: {
  productId?: number
  page?: number
}): Promise<ActionResult<{ adjustments: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('stock_adjustments')
    .select('*, products(name, unit, sku), users(full_name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (filters?.productId) {
    query = query.eq('product_id', filters.productId)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }

  const adjustments = (data ?? []).map((a: any) => ({
    ...a,
    product_name: a.products?.name ?? '—',
    product_unit: a.products?.unit ?? '',
    done_by: a.users?.full_name ?? '—',
  }))

  return { data: { adjustments, total: count ?? 0 }, error: null }
}

export async function createStockAdjustment(input: StockAdjustmentInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = stockAdjustmentSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity, name')
    .eq('id', parsed.data.product_id)
    .single()

  if (!product) return { data: null, error: 'Product not found.' }

  if (parsed.data.adjustment_type === 'SUBTRACT') {
    if (parsed.data.quantity > product.stock_quantity) {
      return {
        data: null,
        error: `Cannot subtract ${parsed.data.quantity}. Only ${product.stock_quantity} units in stock.`,
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error: insertError } = await supabase.from('stock_adjustments').insert({
    product_id: parsed.data.product_id,
    adjustment_type: parsed.data.adjustment_type,
    quantity: parsed.data.quantity,
    reason: parsed.data.reason,
    created_by: user?.id ?? null,
  })
  if (insertError) return { data: null, error: insertError.message }

  const newQty = parsed.data.adjustment_type === 'ADD'
    ? product.stock_quantity + parsed.data.quantity
    : product.stock_quantity - parsed.data.quantity

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newQty })
    .eq('id', parsed.data.product_id)
  if (updateError) return { data: null, error: updateError.message }

  return { data: null, error: null }
}
