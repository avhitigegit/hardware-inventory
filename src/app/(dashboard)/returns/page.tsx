'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getReturns } from '@/actions/returns.actions'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'

export default function ReturnsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['returns', page],
    queryFn: async () => {
      const r = await getReturns({ page })
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  const returns = data?.returns ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Returns</h1>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <Button onClick={() => router.push('/returns/new')}>New Return</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Return #</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Items</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Processed By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}</tr>
                ))
              : returns.length === 0
              ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400">No returns recorded yet.</td>
                  </tr>
                )
              : returns.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">RET-{String(r.id).padStart(6, '0')}</td>
                    <td className="px-4 py-3">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3">{r.customer_name}</td>
                    <td className="px-4 py-3 text-right">{r.items_count}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.total_return_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={r.return_method === 'CASH_REFUND' ? 'outline' : 'secondary'}>
                        {r.return_method === 'CASH_REFUND' ? 'Cash Refund' : 'Credit Adj.'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.created_by_name}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="returns" />
    </div>
  )
}
