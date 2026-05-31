'use server'

import { createClient } from '@/lib/supabase/server'
import { customerSchema, customerPaymentSchema, type CustomerInput, type CustomerPaymentInput } from '@/lib/validations/customer.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

export async function getCustomers(): Promise<ActionResult<any[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name')
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getCustomerList(filters?: {
  creditOnly?: boolean
  page?: number
}): Promise<ActionResult<{ customers: any[]; total: number }>> {
  const supabase = await createClient()
  const PAGE_SIZE = 20
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('name')

  if (filters?.creditOnly) query = query.gt('credit_balance', 0)

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return { data: { customers: data ?? [], total: count ?? 0 }, error: null }
}

export async function getCreditCustomers(): Promise<ActionResult<any[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .gt('credit_balance', 0)
    .order('name')
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getCustomerById(id: number): Promise<ActionResult<any>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getCustomerSales(customerId: number): Promise<ActionResult<any[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(count), users(full_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  const sales = (data ?? []).map((s: any) => ({
    ...s,
    items_count: s.sale_items?.[0]?.count ?? 0,
    cashier_name: s.users?.full_name ?? '—',
  }))
  return { data: sales, error: null }
}

export async function getCustomerPayments(customerId: number): Promise<ActionResult<any[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customer_payments')
    .select('*, users(full_name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  const payments = (data ?? []).map((p: any) => ({
    ...p,
    recorded_by: p.users?.full_name ?? '—',
  }))
  return { data: payments, error: null }
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }
  const { error } = await supabase.from('customers').insert({
    ...parsed.data,
    email: parsed.data.email || null,
  })
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function updateCustomer(id: number, input: CustomerInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = customerSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }
  const { error } = await supabase.from('customers').update({
    ...parsed.data,
    email: parsed.data.email || null,
  }).eq('id', id)
  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function recordCustomerPayment(
  customerId: number,
  input: CustomerPaymentInput
): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = customerPaymentSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { data: customer } = await supabase
    .from('customers')
    .select('credit_balance, name')
    .eq('id', customerId)
    .single()
  if (!customer) return { data: null, error: 'Customer not found.' }
  if (parsed.data.amount > customer.credit_balance) {
    return { data: null, error: `Amount exceeds credit balance of Rs. ${customer.credit_balance.toFixed(2)}.` }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error: paymentError } = await supabase.from('customer_payments').insert({
    customer_id: customerId,
    amount: parsed.data.amount,
    notes: parsed.data.notes ?? null,
    created_by: user?.id ?? null,
  })
  if (paymentError) return { data: null, error: paymentError.message }

  const { error: updateError } = await supabase
    .from('customers')
    .update({ credit_balance: customer.credit_balance - parsed.data.amount })
    .eq('id', customerId)
  if (updateError) return { data: null, error: updateError.message }

  return { data: null, error: null }
}
