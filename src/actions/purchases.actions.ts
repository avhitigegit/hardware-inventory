'use server'

import { createClient } from '@/lib/supabase/server'
import { purchaseSchema, type PurchaseInput } from '@/lib/validations/purchase.schema'
import { writeAuditLog } from './audit.actions'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 20

export async function getPurchases(filters?: {
  supplierId?: number
  page?: number
}): Promise<ActionResult<{ purchases: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('purchases')
    .select('*, suppliers(name), users(full_name), purchase_items(count)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (filters?.supplierId) {
    query = query.eq('supplier_id', filters.supplierId)
  }

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }

  const purchases = (data ?? []).map((p: any) => ({
    ...p,
    supplier_name: p.suppliers?.name ?? '—',
    created_by_name: p.users?.full_name ?? '—',
    items_count: p.purchase_items?.[0]?.count ?? 0,
  }))

  return { data: { purchases, total: count ?? 0 }, error: null }
}

export async function getPurchaseById(id: number): Promise<ActionResult<any>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, suppliers(*), users(full_name), purchase_items(*, products(name, unit, sku))')
    .eq('id', id)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createPurchase(input: PurchaseInput): Promise<ActionResult<{ id: number }>> {
  const supabase = await createClient()
  const parsed = purchaseSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { data: { user } } = await supabase.auth.getUser()

  const totalAmount = parsed.data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  )

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert({
      supplier_id: parsed.data.supplier_id,
      invoice_number: parsed.data.invoice_number || null,
      payment_type: parsed.data.payment_type,
      notes: parsed.data.notes || null,
      total_amount: totalAmount,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (purchaseError) return { data: null, error: purchaseError.message }

  const purchaseItems = parsed.data.items.map((item) => ({
    purchase_id: purchase.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('purchase_items').insert(purchaseItems)
  if (itemsError) return { data: null, error: itemsError.message }

  const { data: supplier } = await supabase.from('suppliers').select('name').eq('id', parsed.data.supplier_id).single()
  await writeAuditLog(supabase, {
    action: 'CREATE', entity: 'purchase', entity_id: String(purchase.id),
    description: `Received GRN-${String(purchase.id).padStart(6, '0')} from "${supplier?.name ?? '—'}" — ${parsed.data.items.length} item(s), Rs. ${totalAmount.toFixed(2)} (${parsed.data.payment_type})`,
  })

  return { data: { id: purchase.id }, error: null }
}
