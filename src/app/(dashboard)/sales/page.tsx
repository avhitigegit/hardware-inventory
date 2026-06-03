'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getSales } from '@/actions/sales.actions'
import { getCustomers } from '@/actions/customers.actions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'
import { cn } from '@/lib/utils'

function colomboToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function colomboOffset(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

function startOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const paymentBadge: Record<string, string> = {
  CASH:   'bg-green-100 text-green-700 border-green-200',
  CREDIT: 'bg-amber-100 text-amber-700 border-amber-200',
  SPLIT:  'bg-blue-100 text-blue-700 border-blue-200',
}

export default function SalesPage() {
  const router = useRouter()
  const [page, setPage]               = useState(1)
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [customerId, setCustomerId]   = useState<number | ''>('')
  const [paymentType, setPaymentType] = useState('')
  const [activeQuick, setActiveQuick] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, startDate, endDate, customerId, paymentType],
    queryFn: async () => {
      const result = await getSales({ page, startDate: startDate || undefined, endDate: endDate || undefined, customerId: customerId ? Number(customerId) : undefined, paymentType: paymentType || undefined })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await getCustomers(); return r.data ?? [] },
  })

  const sales       = data?.sales ?? []
  const total       = data?.total ?? 0
  const totalPages  = Math.ceil(total / 20)

  const totalRevenue  = sales.reduce((s: number, r: any) => s + r.total_amount, 0)
  const cashRevenue   = sales.filter((s: any) => s.payment_type === 'CASH').reduce((s: number, r: any) => s + r.total_amount, 0)
  const creditRevenue = sales.filter((s: any) => s.payment_type === 'CREDIT').reduce((s: number, r: any) => s + r.total_amount, 0)
  const splitRevenue  = sales.filter((s: any) => s.payment_type === 'SPLIT').reduce((s: number, r: any) => s + r.total_amount, 0)

  const applyQuick = (label: string, start: string, end: string) => {
    setActiveQuick(label); setStartDate(start); setEndDate(end); setPage(1)
  }

  const resetFilters = () => {
    setStartDate(''); setEndDate(''); setCustomerId(''); setPaymentType(''); setPage(1); setActiveQuick('')
  }

  const quickButtons = [
    { label: 'Today',      start: colomboToday(),  end: colomboToday() },
    { label: 'Yesterday',  start: colomboOffset(-1), end: colomboOffset(-1) },
    { label: 'This Week',  start: startOfWeek(),   end: colomboToday() },
    { label: 'This Month', start: startOfMonth(),  end: colomboToday() },
  ]

  const hasFilters = startDate || endDate || customerId || paymentType

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <Button onClick={() => router.push('/sales/pos')} className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          POS Terminal
        </Button>
      </div>

      {/* Quick date buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 font-medium mr-1">Quick:</span>
        {quickButtons.map(q => (
          <button
            key={q.label}
            onClick={() => applyQuick(q.label, q.start, q.end)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              activeQuick === q.label
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-800'
            )}
          >
            {q.label}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors ml-1"
          >
            ✕ Clear filters
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-xl border">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From Date</label>
          <Input type="date" value={startDate}
            onChange={e => { setStartDate(e.target.value); setActiveQuick(''); setPage(1) }}
            className="w-38 text-sm h-9" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To Date</label>
          <Input type="date" value={endDate}
            onChange={e => { setEndDate(e.target.value); setActiveQuick(''); setPage(1) }}
            className="w-38 text-sm h-9" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</label>
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white h-9 min-w-[150px]"
            value={customerId}
            onChange={e => { setCustomerId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}>
            <option value="">All Customers</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payment Type</label>
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white h-9 min-w-[120px]"
            value={paymentType}
            onChange={e => { setPaymentType(e.target.value); setPage(1) }}>
            <option value="">All Types</option>
            <option value="CASH">CASH</option>
            <option value="CREDIT">CREDIT</option>
            <option value="SPLIT">SPLIT</option>
          </select>
        </div>
      </div>

      {/* Revenue summary bar — shown when data is loaded */}
      {!isLoading && sales.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Revenue',  value: formatCurrency(totalRevenue),  color: 'text-gray-800'  },
            { label: 'Cash',           value: formatCurrency(cashRevenue),   color: 'text-green-700' },
            { label: 'Credit',         value: formatCurrency(creditRevenue), color: 'text-amber-600' },
            { label: 'Split',          value: formatCurrency(splitRevenue),  color: 'text-blue-600'  },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border px-4 py-3">
              <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date / Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cashier</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : sales.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center">
                      <p className="text-gray-400 text-sm">No sales found.</p>
                      {hasFilters && (
                        <button onClick={resetFilters} className="mt-2 text-xs text-blue-500 hover:underline">
                          Clear filters to see all sales
                        </button>
                      )}
                    </td>
                  </tr>
                )
              : sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-700">{formatDateTime(s.created_at)}</td>
                    <td className="px-4 py-3 font-medium">
                      {s.customer_name ?? <span className="text-gray-400 font-normal">Walk-in</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatCurrency(s.total_amount)}
                      {s.discount_amount > 0 && (
                        <span className="ml-1 text-xs text-green-600 font-normal">
                          −{formatCurrency(s.discount_amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                        paymentBadge[s.payment_type] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {s.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.cashier_name}</td>
                  </tr>
                ))}
          </tbody>
          {!isLoading && sales.length > 0 && (
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-500">
                  Showing {sales.length} of {total} records
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">
                  {formatCurrency(totalRevenue)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="sales" />
    </div>
  )
}
