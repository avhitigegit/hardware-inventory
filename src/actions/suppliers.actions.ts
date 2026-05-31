'use server'

import { createClient } from '@/lib/supabase/server'
import { supplierSchema, supplierPaymentSchema, type SupplierInput, type SupplierPaymentInput } from '@/lib/validations/supplier.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

export async function getSuppliers(): Promise<ActionResult<any[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getSupplierList(filters?: {
  page?: number
}): Promise<ActionResult<{ suppliers: any[]; total: number }>> {
  const supabase = await createClient()
  const PAGE_SIZE = 20
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('name')

  if (error) return { data: null, error: error.message }
  return { data: { suppliers: data ?? [], total: count ?? 0 }, error: null }
}

export async function getSupplierById(id: number): Promise<ActionResult<any>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getSupplierPurchases(supplierId: number): Promise<ActionResult<any[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('purchases')
    .select('*, purchase_items(count), users(full_name)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const purchases = data.map((p: any) => ({
    ...p,
    items_count: p.purchase_items?.[0]?.count ?? 0,
    created_by_name: p.users?.full_name ?? '—',
  }))

  return { data: purchases, error: null }
}

export async function getSupplierPayments(supplierId: number): Promise<ActionResult<any[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('supplier_payments')
    .select('*, users(full_name)')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  const payments = data.map((p: any) => ({
    ...p,
    recorded_by: p.users?.full_name ?? '—',
  }))

  return { data: payments, error: null }
}

export async function createSupplier(input: SupplierInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('suppliers').insert(parsed.data)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function updateSupplier(id: number, input: SupplierInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = supplierSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('suppliers').update(parsed.data).eq('id', id)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function deleteSupplier(id: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', id)

  if (count && count > 0) {
    return { data: null, error: 'Cannot delete a supplier with purchase history.' }
  }

  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function recordSupplierPayment(
  supplierId: number,
  input: SupplierPaymentInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = supplierPaymentSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('credit_balance, name')
    .eq('id', supplierId)
    .single()

  if (!supplier) return { data: null, error: 'Supplier not found.' }

  if (parsed.data.amount > supplier.credit_balance) {
    return { data: null, error: `Amount exceeds credit balance of Rs. ${supplier.credit_balance.toFixed(2)}.` }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error: paymentError } = await supabase.from('supplier_payments').insert({
    supplier_id: supplierId,
    amount: parsed.data.amount,
    notes: parsed.data.notes ?? null,
    created_by: user?.id ?? null,
  })
  if (paymentError) return { data: null, error: paymentError.message }

  const { error: updateError } = await supabase
    .from('suppliers')
    .update({ credit_balance: supplier.credit_balance - parsed.data.amount })
    .eq('id', supplierId)
  if (updateError) return { data: null, error: updateError.message }

  return { data: null, error: null }
}
