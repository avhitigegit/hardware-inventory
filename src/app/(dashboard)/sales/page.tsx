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

export default function SalesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [paymentType, setPaymentType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, startDate, endDate, customerId, paymentType],
    queryFn: async () => {
      const result = await getSales({
        page,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerId: customerId ? Number(customerId) : undefined,
        paymentType: paymentType || undefined,
      })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await getCustomers(); return r.data ?? [] },
  })

  const sales = data?.sales ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const resetFilters = () => {
    setStartDate(''); setEndDate(''); setCustomerId(''); setPaymentType(''); setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales History</h1>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <Button onClick={() => router.push('/sales/pos')}>POS Terminal</Button>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">From Date</label>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} className="w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">To Date</label>
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} className="w-36" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Customer</label>
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white"
            value={customerId}
            onChange={(e) => { setCustomerId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}>
            <option value="">All Customers</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Payment Type</label>
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white"
            value={paymentType}
            onChange={(e) => { setPaymentType(e.target.value); setPage(1) }}>
            <option value="">All Types</option>
            <option value="CASH">CASH</option>
            <option value="CREDIT">CREDIT</option>
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={resetFilters}>Clear</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
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
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : sales.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No sales found.</td>
                  </tr>
                )
              : sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/sales/${s.id}`)}>
                    <td className="px-4 py-3">{formatDateTime(s.created_at)}</td>
                    <td className="px-4 py-3">{s.customer_name ?? <span className="text-gray-400">Walk-in</span>}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={s.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{s.payment_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.cashier_name}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages} — {total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
