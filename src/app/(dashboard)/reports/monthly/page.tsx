'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { getMonthlyReport } from '@/actions/reports.actions'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

const MonthlyReportPdf = dynamic(() => import('@/components/pdf/MonthlyReportPdf'), { ssr: false })

function currentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  )
}

export default function MonthlyReportPage() {
  const def = currentYearMonth()
  const [year, setYear] = useState(def.year)
  const [month, setMonth] = useState(def.month)

  const { data: summary, isLoading } = useQuery({
    queryKey: ['monthly-report', year, month],
    queryFn: async () => {
      const r = await getMonthlyReport(year, month)
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const years = Array.from({ length: 5 }, (_, i) => def.year - i)

  const chartData = (summary?.days ?? []).map(d => ({
    date: d.date.slice(8), // DD
    revenue: d.daily_total,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Monthly Report</h1>
          <p className="text-sm text-gray-500">Sales summary for a specific month</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {summary && !isLoading && (
            <MonthlyReportPdf year={year} month={month} summary={summary} />
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-5 space-y-2">
              <Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard title="Total Sales" value={String(summary?.total_sales ?? 0)} />
            <SummaryCard title="Total Revenue" value={formatCurrency(summary?.total_revenue ?? 0)} />
            <SummaryCard title="Avg Daily Revenue" value={formatCurrency(summary?.avg_daily_revenue ?? 0)} />
          </>
        )}
      </div>

      {/* Bar Chart */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Revenue — {months[month - 1]} {year}</h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-center text-gray-400 py-16">No sales data for this month.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenue']} contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Days Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Sales Count</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Cash Total</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Credit Total</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Daily Total</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                ))}</tr>
              ))
            ) : (summary?.days ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No sales data for this month.</td>
              </tr>
            ) : (
              (summary?.days ?? []).map((d: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{d.date}</td>
                  <td className="px-4 py-3 text-right">{d.sales_count}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(d.cash_total)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(d.credit_total)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(d.daily_total)}</td>
                </tr>
              ))
            )}
          </tbody>
          {(summary?.days ?? []).length > 0 && (
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total Revenue</td>
                <td className="px-4 py-3 text-right font-bold">{formatCurrency(summary?.total_revenue ?? 0)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
