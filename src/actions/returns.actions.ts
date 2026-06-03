'use server'

import { createClient } from '@/lib/supabase/server'
import { returnSchema, type ReturnInput } from '@/lib/validations/return.schema'
import { writeAuditLog } from './audit.actions'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 20

export async function getReturns(filters?: { page?: number }): Promise<ActionResult<{ returns: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('returns')
    .select('*, customers(name), users(full_name), return_items(count)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const returns = (data ?? []).map((r: any) => ({
    ...r,
    customer_name: r.customers?.name ?? '—',
    created_by_name: r.users?.full_name ?? '—',
    items_count: r.return_items?.[0]?.count ?? 0,
  }))

  return { data: { returns, total: count ?? 0 }, error: null }
}

export async function createReturn(input: ReturnInput): Promise<ActionResult<{ id: number }>> {
  const supabase = await createClient()
  const parsed = returnSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { items, customer_id, return_method, notes, sale_id } = parsed.data

  if (return_method === 'CREDIT_ADJUSTMENT' && !customer_id) {
    return { data: null, error: 'Customer is required for credit adjustment returns.' }
  }

  const total_return_amount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  const { data: { user } } = await supabase.auth.getUser()

  const { data: ret, error: retError } = await supabase
    .from('returns')
    .insert({
      sale_id: sale_id ?? null,
      customer_id: customer_id ?? null,
      total_return_amount,
      return_method,
      notes: notes ?? null,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (retError) return { data: null, error: retError.message }

  const { error: itemsError } = await supabase.from('return_items').insert(
    items.map(i => ({
      return_id: ret.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      total_price: i.quantity * i.unit_price,
    }))
  )
  if (itemsError) return { data: null, error: itemsError.message }

  // Restore stock — fetch all returned products in one query, then update each
  const returnIds = items.map(i => i.product_id)
  const { data: returnedProducts } = await supabase
    .from('products')
    .select('id, stock_quantity')
    .in('id', returnIds)

  const returnedMap = new Map((returnedProducts ?? []).map(p => [p.id, p]))

  for (const item of items) {
    const product = returnedMap.get(item.product_id)
    if (product) {
      await supabase
        .from('products')
        .update({ stock_quantity: product.stock_quantity + item.quantity })
        .eq('id', item.product_id)
    }
  }

  // If CREDIT_ADJUSTMENT, reduce the customer's credit balance
  if (return_method === 'CREDIT_ADJUSTMENT' && customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('credit_balance')
      .eq('id', customer_id)
      .single()
    if (customer) {
      await supabase
        .from('customers')
        .update({ credit_balance: Math.max(0, customer.credit_balance - total_return_amount) })
        .eq('id', customer_id)
    }
  }

  await writeAuditLog(supabase, {
    action: 'CREATE', entity: 'return', entity_id: String(ret.id),
    description: `Processed return RET-${String(ret.id).padStart(6, '0')} — Rs. ${total_return_amount.toFixed(2)} (${return_method === 'CASH_REFUND' ? 'Cash Refund' : 'Credit Adjustment'})`,
  })

  return { data: { id: ret.id }, error: null }
}
