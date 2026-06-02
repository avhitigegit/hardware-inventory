'use server'

import { createClient } from '@/lib/supabase/server'
import { type SaleInput } from '@/lib/validations/sale.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 20

export async function getSales(filters?: {
  customerId?: number
  startDate?: string
  endDate?: string
  paymentType?: string
  page?: number
}): Promise<ActionResult<{ sales: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('sales')
    .select('*, customers(name), users(full_name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (filters?.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters?.startDate) query = query.gte('created_at', filters.startDate)
  if (filters?.endDate) query = query.lte('created_at', filters.endDate + 'T23:59:59')
  if (filters?.paymentType) query = query.eq('payment_type', filters.paymentType)

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }

  const sales = (data ?? []).map((s: any) => ({
    ...s,
    customer_name: s.customers?.name ?? null,
    cashier_name: s.users?.full_name ?? '—',
  }))

  return { data: { sales, total: count ?? 0 }, error: null }
}

export async function getSaleById(id: number): Promise<ActionResult<any>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*, customers(name, phone), users(full_name), sale_items(*, products(name, unit, sku))')
    .eq('id', id)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createSale(input: SaleInput): Promise<ActionResult<{ id: number }>> {
  const supabase = await createClient()

  if (!input.items || input.items.length === 0) {
    return { data: null, error: 'Cart is empty.' }
  }

  if (input.payment_type === 'CREDIT' && !input.customer_id) {
    return { data: null, error: 'Customer is required for credit sales.' }
  }

  if (input.payment_type === 'SPLIT' && !input.customer_id) {
    return { data: null, error: 'Customer is required for split payment sales.' }
  }

  // Stock check
  for (const item of input.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, name, is_active')
      .eq('id', item.product_id)
      .single()

    if (!product) return { data: null, error: `Product not found.` }
    if (!product.is_active) return { data: null, error: `${item.product_name} is not available for sale.` }
    if (product.stock_quantity < item.quantity) {
      return {
        data: null,
        error: `Insufficient stock for ${item.product_name}. In stock: ${product.stock_quantity}, Requested: ${item.quantity}`,
      }
    }
  }

  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const discountAmount = input.discount_amount ?? 0
  const totalAmount = Math.max(0, subtotal - discountAmount)

  if (discountAmount > subtotal) {
    return { data: null, error: 'Discount cannot exceed the subtotal.' }
  }

  // Credit limit check
  const creditPortion =
    input.payment_type === 'CREDIT' ? totalAmount :
    input.payment_type === 'SPLIT' ? Math.max(0, totalAmount - (input.cash_amount ?? 0)) : 0

  if (creditPortion > 0 && input.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('credit_balance, credit_limit, name')
      .eq('id', input.customer_id)
      .single()

    if (customer && customer.credit_limit > 0) {
      if (customer.credit_balance + creditPortion > customer.credit_limit) {
        const available = customer.credit_limit - customer.credit_balance
        return {
          data: null,
          error: `Credit limit exceeded for ${customer.name}. Available credit: Rs. ${available.toFixed(2)}`,
        }
      }
    }
  }

  // Cash payment validation
  if (input.payment_type === 'CASH') {
    const received = input.amount_received ?? 0
    if (received < totalAmount) {
      return { data: null, error: `Amount received (Rs. ${received.toFixed(2)}) is less than total (Rs. ${totalAmount.toFixed(2)}).` }
    }
  }

  if (input.payment_type === 'SPLIT') {
    const cashPaid = input.cash_amount ?? 0
    if (cashPaid <= 0) return { data: null, error: 'Cash amount must be greater than 0 for split payment.' }
    if (cashPaid >= totalAmount) return { data: null, error: 'Cash amount must be less than total for split payment. Use CASH instead.' }
  }

  const { data: { user } } = await supabase.auth.getUser()

  let paidAmount = 0
  let balanceAmount = 0

  if (input.payment_type === 'CASH') {
    paidAmount = totalAmount
    balanceAmount = 0
  } else if (input.payment_type === 'CREDIT') {
    paidAmount = 0
    balanceAmount = totalAmount
  } else {
    paidAmount = input.cash_amount ?? 0
    balanceAmount = Math.max(0, totalAmount - paidAmount)
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      customer_id: input.customer_id ?? null,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      payment_type: input.payment_type,
      notes: input.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()

  if (saleError) return { data: null, error: saleError.message }

  const saleItems = input.items.map((item) => ({
    sale_id: sale.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) return { data: null, error: itemsError.message }

  return { data: { id: sale.id }, error: null }
}
