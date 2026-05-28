'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { getPurchaseById } from '@/actions/purchases.actions'
import { formatCurrency, formatDateTime, zeroPad } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/useUser'

const GrnPdfDownload = dynamic(() => import('@/components/pdf/GrnPdfDownload'), { ssr: false })

export default function PurchaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const id = Number(params.id)

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const result = await getPurchaseById(id)
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!purchase) return <p className="text-red-500">GRN not found.</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/purchases')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to GRN List</button>
          <h1 className="text-2xl font-bold text-gray-800">GRN-{zeroPad(purchase.id, 6)}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(purchase.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={purchase.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{purchase.payment_type}</Badge>
          <GrnPdfDownload purchase={purchase} receivedBy={user?.full_name ?? 'Unknown'} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Supplier & Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Supplier</dt>
              <dd className="font-medium">{purchase.suppliers?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Invoice Number</dt>
              <dd className="font-medium">{purchase.invoice_number ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Payment Type</dt>
              <dd className="font-medium">{purchase.payment_type}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Created By</dt>
              <dd className="font-medium">{purchase.users?.full_name ?? '—'}</dd>
            </div>
            {purchase.notes && (
              <div className="md:col-span-2">
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="font-medium">{purchase.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(purchase.purchase_items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.products?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.products?.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{item.products?.unit ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-semibold">Grand Total</td>
                <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(purchase.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
