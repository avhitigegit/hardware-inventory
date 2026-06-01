'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

function colomboDateStr(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

function dayStartEndUTC(colomboDate: string) {
  const start = new Date(`${colomboDate}T00:00:00+05:30`).toISOString()
  const end = new Date(`${colomboDate}T23:59:59.999+05:30`).toISOString()
  return { start, end }
}

// ──────────────────────────────────────────────────────────────────────────
// Dashboard Summary
// ──────────────────────────────────────────────────────────────────────────

export type DashboardSummary = {
  today_sales_count: number
  today_revenue: number
  total_active_products: number
  low_stock_count: number
  customer_credit_outstanding: number
  supplier_credit_outstanding: number
  chart_data: { date: string; revenue: number }[]
}

export async function getDashboardSummary(): Promise<ActionResult<DashboardSummary>> {
  const supabase = await createClient()
  const today = colomboDateStr()
  const { start: todayStart, end: todayEnd } = dayStartEndUTC(today)

  // Today's sales
  const { data: todaySales, error: e1 } = await supabase
    .from('sales')
    .select('total_amount')
    .gte('created_at', todayStart)
    .lte('created_at', todayEnd)
  if (e1) return { data: null, error: e1.message }

  // Active product count
  const { count: productCount, error: e2 } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
  if (e2) return { data: null, error: e2.message }

  // Low stock: fetch all active, filter JS-side
  const { data: allProducts, error: e3 } = await supabase
    .from('products')
    .select('stock_quantity, reorder_level')
    .eq('is_active', true)
  if (e3) return { data: null, error: e3.message }
  const lowStockCount = (allProducts ?? []).filter(p => p.stock_quantity <= p.reorder_level).length

  // Customer credit outstanding
  const { data: custCredit, error: e4 } = await supabase
    .from('customers')
    .select('credit_balance')
  if (e4) return { data: null, error: e4.message }

  // Supplier credit outstanding
  const { data: suppCredit, error: e5 } = await supabase
    .from('suppliers')
    .select('credit_balance')
  if (e5) return { data: null, error: e5.message }

  // Last 30 days chart
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  const { data: recentSales, error: e6 } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
  if (e6) return { data: null, error: e6.message }

  // Group by Colombo date
  const grouped: Record<string, number> = {}
  for (const s of recentSales ?? []) {
    const d = colomboDateStr(new Date(s.created_at))
    grouped[d] = (grouped[d] ?? 0) + s.total_amount
  }
  const chart_data: { date: string; revenue: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = colomboDateStr(d)
    chart_data.push({ date: dateStr.slice(5), revenue: grouped[dateStr] ?? 0 }) // MM-DD for display
  }

  return {
    data: {
      today_sales_count: todaySales?.length ?? 0,
      today_revenue: (todaySales ?? []).reduce((s, r) => s + r.total_amount, 0),
      total_active_products: productCount ?? 0,
      low_stock_count: lowStockCount,
      customer_credit_outstanding: (custCredit ?? []).reduce((s, r) => s + r.credit_balance, 0),
      supplier_credit_outstanding: (suppCredit ?? []).reduce((s, r) => s + r.credit_balance, 0),
      chart_data,
    },
    error: null,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Daily Report
// ──────────────────────────────────────────────────────────────────────────

export type DailySummary = {
  count: number
  total_revenue: number
  cash_revenue: number
  credit_revenue: number
  sales: any[]
}

export async function getDailyReport(colomboDate: string): Promise<ActionResult<DailySummary>> {
  const supabase = await createClient()
  const { start, end } = dayStartEndUTC(colomboDate)

  const { data, error } = await supabase
    .from('sales')
    .select('*, customers(name), users(full_name), sale_items(count)')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at')

  if (error) return { data: null, error: error.message }

  const sales = (data ?? []).map((s: any) => ({
    ...s,
    customer_name: s.customers?.name ?? 'Walk-in',
    cashier_name: s.users?.full_name ?? '—',
    items_count: s.sale_items?.[0]?.count ?? 0,
  }))

  const total_revenue = sales.reduce((s, r) => s + r.total_amount, 0)
  const cash_revenue = sales.filter(s => s.payment_type === 'CASH').reduce((s, r) => s + r.total_amount, 0)
  const credit_revenue = sales.filter(s => s.payment_type === 'CREDIT').reduce((s, r) => s + r.total_amount, 0)

  return {
    data: { count: sales.length, total_revenue, cash_revenue, credit_revenue, sales },
    error: null,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Monthly Report
// ──────────────────────────────────────────────────────────────────────────

export type MonthlySummary = {
  total_sales: number
  total_revenue: number
  avg_daily_revenue: number
  days: { date: string; sales_count: number; cash_total: number; credit_total: number; daily_total: number }[]
}

export async function getMonthlyReport(year: number, month: number): Promise<ActionResult<MonthlySummary>> {
  const supabase = await createClient()
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStr = `${year}-${pad(month)}`

  // Start = first day of month at midnight Colombo, End = last day at 23:59:59 Colombo
  const daysInMonth = new Date(year, month, 0).getDate()
  const start = new Date(`${monthStr}-01T00:00:00+05:30`).toISOString()
  const end = new Date(`${monthStr}-${pad(daysInMonth)}T23:59:59.999+05:30`).toISOString()

  const { data, error } = await supabase
    .from('sales')
    .select('total_amount, payment_type, created_at')
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at')

  if (error) return { data: null, error: error.message }

  // Group by Colombo date
  const grouped: Record<string, { cash: number; credit: number; count: number }> = {}
  for (const s of data ?? []) {
    const d = colomboDateStr(new Date(s.created_at))
    if (!grouped[d]) grouped[d] = { cash: 0, credit: 0, count: 0 }
    grouped[d].count++
    if (s.payment_type === 'CASH') grouped[d].cash += s.total_amount
    else grouped[d].credit += s.total_amount
  }

  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${pad(day)}`
    const g = grouped[dateStr]
    if (!g) continue
    days.push({
      date: dateStr,
      sales_count: g.count,
      cash_total: g.cash,
      credit_total: g.credit,
      daily_total: g.cash + g.credit,
    })
  }

  const total_sales = (data ?? []).length
  const total_revenue = (data ?? []).reduce((s, r) => s + r.total_amount, 0)

  return {
    data: {
      total_sales,
      total_revenue,
      avg_daily_revenue: total_revenue / daysInMonth,
      days,
    },
    error: null,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Low Stock Products
// ──────────────────────────────────────────────────────────────────────────

export async function getLowStockProducts(limit?: number): Promise<ActionResult<any[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), suppliers(name)')
    .eq('is_active', true)
    .order('stock_quantity', { ascending: true })

  if (error) return { data: null, error: error.message }

  const lowStock = (data ?? []).filter(p => p.stock_quantity <= p.reorder_level)
  return { data: limit ? lowStock.slice(0, limit) : lowStock, error: null }
}

// ──────────────────────────────────────────────────────────────────────────
// Top Selling Products
// ──────────────────────────────────────────────────────────────────────────

export type TopProduct = {
  product_id: number
  product_name: string
  sku: string
  qty_sold: number
  revenue: number
}

export async function getTopSellingProducts(
  startDate: string,
  endDate: string,
  limit = 10
): Promise<ActionResult<TopProduct[]>> {
  const supabase = await createClient()

  const startISO = new Date(`${startDate}T00:00:00+05:30`).toISOString()
  const endISO = new Date(`${endDate}T23:59:59.999+05:30`).toISOString()

  // Get sale IDs in date range
  const { data: salesInRange, error: e1 } = await supabase
    .from('sales')
    .select('id')
    .gte('created_at', startISO)
    .lte('created_at', endISO)

  if (e1) return { data: null, error: e1.message }
  if (!salesInRange || salesInRange.length === 0) return { data: [], error: null }

  const saleIds = salesInRange.map(s => s.id)

  const { data: items, error: e2 } = await supabase
    .from('sale_items')
    .select('product_id, quantity, total_price, products(name, sku)')
    .in('sale_id', saleIds)

  if (e2) return { data: null, error: e2.message }

  // Aggregate by product
  const map: Record<number, TopProduct> = {}
  for (const item of items ?? []) {
    const pid = item.product_id
    if (!map[pid]) {
      map[pid] = {
        product_id: pid,
        product_name: (item.products as any)?.name ?? '—',
        sku: (item.products as any)?.sku ?? '—',
        qty_sold: 0,
        revenue: 0,
      }
    }
    map[pid].qty_sold += item.quantity
    map[pid].revenue += item.total_price
  }

  const sorted = Object.values(map)
    .sort((a, b) => b.qty_sold - a.qty_sold)
    .slice(0, limit)

  return { data: sorted, error: null }
}
