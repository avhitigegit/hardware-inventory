'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { getSaleById } from '@/actions/sales.actions'
import { formatCurrency, formatDateTime, zeroPad } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SaleReceiptDownload = dynamic(() => import('@/components/pdf/SaleReceiptDownload'), { ssr: false })

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const result = await getSaleById(id)
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

  if (!sale) return <p className="text-red-500">Sale not found.</p>

  const change = sale.payment_type === 'CASH' ? Math.max(0, (sale.paid_amount ?? 0) - sale.total_amount) : 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/sales')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Sales</button>
          <h1 className="text-2xl font-bold text-gray-800">REC-{zeroPad(sale.id, 6)}</h1>
          <p className="text-sm text-gray-500">{formatDateTime(sale.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={sale.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{sale.payment_type}</Badge>
          <SaleReceiptDownload saleId={sale.id} />
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Sale Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Customer</dt>
              <dd className="font-medium">{sale.customers?.name ?? 'Walk-in Customer'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Cashier</dt>
              <dd className="font-medium">{sale.users?.full_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Total Amount</dt>
              <dd className="font-medium">{formatCurrency(sale.total_amount)}</dd>
            </div>
            {sale.payment_type === 'CASH' && (
              <>
                <div>
                  <dt className="text-gray-500 mb-1">Amount Received</dt>
                  <dd className="font-medium">{formatCurrency(sale.paid_amount)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1">Change</dt>
                  <dd className="font-medium text-green-600">{formatCurrency(change)}</dd>
                </div>
              </>
            )}
            {sale.payment_type === 'CREDIT' && (
              <div>
                <dt className="text-gray-500 mb-1">Credit Amount</dt>
                <dd className="font-medium text-amber-600">{formatCurrency(sale.balance_amount)}</dd>
              </div>
            )}
            {sale.notes && (
              <div className="md:col-span-2">
                <dt className="text-gray-500 mb-1">Notes</dt>
                <dd className="font-medium">{sale.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(sale.sale_items ?? []).map((item: any) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-medium">{item.products?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.products?.sku ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold">Total</td>
                <td className="px-4 py-3 text-right font-bold text-lg">{formatCurrency(sale.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
