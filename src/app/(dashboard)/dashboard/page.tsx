'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getLowStockProducts } from '@/actions/reports.actions'
import { formatCurrency } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function SummaryCard({
  title, value, sub, onClick, highlight,
}: {
  title: string
  value: string
  sub?: string
  onClick?: () => void
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border bg-white p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${highlight ? 'border-amber-300 bg-amber-50' : ''}`}
      onClick={onClick}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-amber-700' : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const r = await getDashboardSummary()
      if (r.error) throw new Error(r.error)
      return r.data
    },
    refetchInterval: 60_000,
  })

  const { data: lowStockProducts = [], isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock-dashboard'],
    queryFn: async () => {
      const r = await getLowStockProducts(10)
      return r.data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Real-time overview of your inventory and sales</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-white p-5 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))
        ) : (
          <>
            <SummaryCard
              title="Today's Revenue"
              value={formatCurrency(summary?.today_revenue ?? 0)}
              sub={`${summary?.today_sales_count ?? 0} sales today`}
            />
            <SummaryCard
              title="Active Products"
              value={String(summary?.total_active_products ?? 0)}
            />
            <SummaryCard
              title="Low Stock Alert"
              value={String(summary?.low_stock_count ?? 0)}
              sub="Click to view"
              highlight={(summary?.low_stock_count ?? 0) > 0}
              onClick={() => router.push('/reports/low-stock')}
            />
            <SummaryCard
              title="Customer Credit"
              value={formatCurrency(summary?.customer_credit_outstanding ?? 0)}
              sub="Outstanding balance"
            />
            <SummaryCard
              title="Supplier Credit"
              value={formatCurrency(summary?.supplier_credit_outstanding ?? 0)}
              sub="Amount owed"
            />
          </>
        )}
      </div>

      {/* Sales Chart */}
      <div className="rounded-lg border bg-white p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Daily Revenue — Last 30 Days</h2>
        {summaryLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary?.chart_data ?? []} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Revenue']}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low Stock Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Low Stock Products</h2>
          <button
            onClick={() => router.push('/reports/low-stock')}
            className="text-sm text-blue-600 hover:underline"
          >
            View all →
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Stock</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Reorder Level</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {lowStockLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : lowStockProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  All products are sufficiently stocked.
                </td>
              </tr>
            ) : (
              lowStockProducts.map((p: any) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${p.stock_quantity === 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock_quantity} {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.reorder_level}</td>
                  <td className="px-4 py-3 text-gray-600">{p.suppliers?.name ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
