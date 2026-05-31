'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { getLowStockProducts } from '@/actions/reports.actions'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const LowStockReportPdf = dynamic(() => import('@/components/pdf/LowStockReportPdf'), { ssr: false })

export default function LowStockReportPage() {
  const router = useRouter()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['low-stock-report'],
    queryFn: async () => {
      const r = await getLowStockProducts()
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Dashboard</button>
          <h1 className="text-2xl font-bold text-gray-800">Low Stock Report</h1>
          <p className="text-sm text-gray-500">
            {isLoading ? '…' : `${products.length} product${products.length !== 1 ? 's' : ''} below reorder level`}
          </p>
        </div>
        {!isLoading && products.length > 0 && (
          <LowStockReportPdf products={products} />
        )}
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Current Stock</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Reorder Level</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                ))}</tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  All products are sufficiently stocked.
                </td>
              </tr>
            ) : (
              products.map((p: any) => {
                const isZero = p.stock_quantity === 0
                return (
                  <tr key={p.id} className={cn('hover:bg-gray-50', isZero ? 'bg-red-50' : 'bg-amber-50')}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{p.categories?.name ?? '—'}</td>
                    <td className={cn('px-4 py-3 text-right font-semibold', isZero ? 'text-red-600' : 'text-amber-600')}>
                      {p.stock_quantity} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{p.reorder_level}</td>
                    <td className="px-4 py-3 text-gray-600">{p.suppliers?.name ?? '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
