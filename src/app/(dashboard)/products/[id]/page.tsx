'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getProductById } from '@/actions/products.actions'
import { formatCurrency, formatDateTime, formatQty } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

function printLabel(product: any) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Shop'
  const barcodeValue = product.barcode ?? product.sku
  const win = window.open('', '_blank', 'width=400,height=300')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<style>
  @page { margin: 0; size: 62mm 29mm; }
  body { margin: 6px 8px; font-family: Arial, sans-serif; }
  .shop { font-size: 8px; color: #555; }
  .name { font-size: 11px; font-weight: bold; margin: 2px 0; line-height: 1.2; }
  .sku  { font-size: 9px; color: #444; letter-spacing: 0.5px; }
  .price{ font-size: 13px; font-weight: bold; margin-top: 3px; }
  .barcode { font-size: 10px; font-family: monospace; letter-spacing: 2px; border: 1px solid #ccc; padding: 2px 6px; display: inline-block; margin-top: 3px; }
</style>
</head>
<body onload="window.print();window.close()">
  <div class="shop">${shopName}</div>
  <div class="name">${product.name}</div>
  <div class="sku">SKU: ${product.sku}</div>
  <div class="price">Rs. ${Number(product.selling_price).toFixed(2)}</div>
  <div class="barcode">${barcodeValue}</div>
</body>
</html>`)
  win.document.close()
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const id = Number(params.id)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const r = await getProductById(id)
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  const canWrite = user?.role && ['ADMIN', 'OWNER', 'STORE_KEEPER'].includes(user.role)

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!product) return <p className="text-red-500">Product not found.</p>

  const isZero = product.stock_quantity === 0
  const isLow = !isZero && product.stock_quantity <= product.reorder_level

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/products')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Products</button>
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge variant={product.is_active ? 'default' : 'secondary'}>
            {product.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button variant="outline" onClick={() => printLabel(product)}>Print Label</Button>
          {canWrite && (
            <Button onClick={() => router.push(`/products/${id}/edit`)}>Edit Product</Button>
          )}
        </div>
      </div>

      {(isZero || isLow) && (
        <div className={cn('rounded-lg px-4 py-3 text-sm font-medium', isZero ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200')}>
          {isZero ? 'Out of stock — no units available.' : `Low stock — only ${product.stock_quantity} ${product.unit} remaining (reorder level: ${product.reorder_level}).`}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Stock Qty</CardTitle></CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', isZero ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800')}>
              {formatQty(product.stock_quantity)}
            </p>
            <p className="text-xs text-gray-400">{product.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Selling Price</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(product.selling_price)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Buying Price</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(product.buying_price)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Reorder Level</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">{product.reorder_level}</p>
            <p className="text-xs text-gray-400">{product.unit}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-gray-500 mb-1">Category</dt>
              <dd className="font-medium">{(product as any).categories?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Supplier</dt>
              <dd className="font-medium">{(product as any).suppliers?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Unit</dt>
              <dd className="font-medium">{product.unit}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Barcode</dt>
              <dd className="font-medium font-mono">{product.barcode ?? '—'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-gray-500 mb-1">Description</dt>
              <dd className="font-medium">{product.description ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Added</dt>
              <dd className="font-medium">{formatDateTime(product.created_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {product.image_url && (
        <Card>
          <CardHeader><CardTitle>Image</CardTitle></CardHeader>
          <CardContent>
            <img src={product.image_url} alt={product.name} className="h-48 w-48 object-cover rounded-md border" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
