'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { getDailyReport } from '@/actions/reports.actions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const DailyReportPdf = dynamic(() => import('@/components/pdf/DailyReportPdf'), { ssr: false })

function todayColombo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function SummaryCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DailyReportPage() {
  const [date, setDate] = useState(todayColombo())

  const { data: summary, isLoading } = useQuery({
    queryKey: ['daily-report', date],
    queryFn: async () => {
      const r = await getDailyReport(date)
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Report</h1>
          <p className="text-sm text-gray-500">Sales summary for a specific day</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
          {summary && !isLoading && (
            <DailyReportPdf date={date} summary={summary} />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-5 space-y-2">
              <Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard title="Total Sales" value={String(summary?.count ?? 0)} />
            <SummaryCard title="Total Revenue" value={formatCurrency(summary?.total_revenue ?? 0)} />
            <SummaryCard title="Cash Revenue" value={formatCurrency(summary?.cash_revenue ?? 0)} />
            <SummaryCard title="Credit Revenue" value={formatCurrency(summary?.credit_revenue ?? 0)} />
          </>
        )}
      </div>

      {/* Sales Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Cashier</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                ))}</tr>
              ))
            ) : (summary?.sales ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No sales on this date.</td>
              </tr>
            ) : (
              (summary?.sales ?? []).map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Intl.DateTimeFormat('en-GB', {
                      timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', hour12: false,
                    }).format(new Date(s.created_at))}
                  </td>
                  <td className="px-4 py-3">{s.customer_name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.cashier_name}</td>
                  <td className="px-4 py-3 text-right">{s.items_count}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{s.payment_type}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {(summary?.count ?? 0) > 0 && (
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td>
                <td className="px-4 py-3 text-right font-bold">{formatCurrency(summary?.total_revenue ?? 0)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
