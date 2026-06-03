'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { getPurchases } from '@/actions/purchases.actions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'

export default function PurchasesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => {
      const result = await getPurchases({ page })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const purchases = data?.purchases ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Purchases / GRN</h1>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <Button onClick={() => router.push('/purchases/new')}>New GRN</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice #</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Created By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : purchases.length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No GRN records yet.</td>
                  </tr>
                )
              : purchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{p.supplier_name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.invoice_number ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{p.items_count}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.total_amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{p.payment_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.created_by_name}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="GRN records" />
    </div>
  )
}
