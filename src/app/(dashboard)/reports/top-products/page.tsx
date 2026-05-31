'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTopSellingProducts } from '@/actions/reports.actions'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function currentMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(daysInMonth).padStart(2, '0')}`,
  }
}

export default function TopProductsPage() {
  const def = currentMonthRange()
  const [startDate, setStartDate] = useState(def.start)
  const [endDate, setEndDate] = useState(def.end)
  const [applied, setApplied] = useState({ start: def.start, end: def.end })

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['top-products', applied.start, applied.end],
    queryFn: async () => {
      const r = await getTopSellingProducts(applied.start, applied.end, 10)
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
  })

  const chartData = products.map((p: any) => ({ name: p.product_name.slice(0, 14), qty: p.qty_sold }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Top Products</h1>
          <p className="text-sm text-gray-500">Best-selling products by quantity sold</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">From</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">To</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
          </div>
          <Button className="mt-5" onClick={() => setApplied({ start: startDate, end: endDate })}>Apply</Button>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Top 10 by Quantity Sold</h2>
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-center text-gray-400 py-16">No sales data for this period.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="qty" name="Qty Sold" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rank</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty Sold</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                ))}</tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">No sales in this period.</td>
              </tr>
            ) : (
              products.map((p: any, i: number) => (
                <tr key={p.product_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-500">#{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.product_name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.qty_sold}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
