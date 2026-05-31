'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getProducts, deleteProduct } from '@/actions/products.actions'
import { getCategories } from '@/actions/categories.actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

export default function ProductsPage() {
  const router = useRouter()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, categoryId, lowStock, page],
    queryFn: async () => {
      const result = await getProducts({ search: debouncedSearch, categoryId, lowStock, page })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories()
      return result.data ?? []
    },
  })

  const products = data?.products ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: (result) => {
      if (result.error) { setDeleteError(result.error); return }
      toast.success('Product deleted.')
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteTarget(null)
      setDeleteError('')
    },
  })

  const canWrite = user?.role && ['ADMIN', 'OWNER', 'STORE_KEEPER'].includes(user.role)
  const canDelete = user?.role && ['ADMIN', 'OWNER'].includes(user.role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
          <p className="text-sm text-gray-500">{total} products</p>
        </div>
        {canWrite && <Button onClick={() => router.push('/products/new')}>Add Product</Button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="rounded-md border px-3 py-2 text-sm bg-white"
          value={categoryId ?? ''}
          onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
        >
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Button
          variant={lowStock ? 'default' : 'outline'}
          onClick={() => { setLowStock(!lowStock); setPage(1) }}
        >
          {lowStock ? 'Low Stock Only ✓' : 'Low Stock Only'}
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Stock</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Selling Price</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">Status</th>
              {canWrite && <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: canWrite ? 8 : 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : products.length === 0
              ? (
                  <tr>
                    <td colSpan={canWrite ? 8 : 7} className="px-4 py-12 text-center text-gray-400">
                      {lowStock ? 'No low stock products.' : 'No products found.'}
                    </td>
                  </tr>
                )
              : products.map((p: any) => {
                  const isZero = p.stock_quantity === 0
                  const isLow = !isZero && p.stock_quantity <= p.reorder_level
                  return (
                    <tr key={p.id} className={cn('hover:bg-gray-50', isZero ? 'bg-red-50' : isLow ? 'bg-amber-50' : '')}>
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                      <td className="px-4 py-3 text-gray-600">{p.categories?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.unit}</td>
                      <td className={cn('px-4 py-3 text-right font-semibold', isZero ? 'text-red-600' : isLow ? 'text-amber-600' : '')}>
                        {p.stock_quantity}
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(p.selling_price)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={p.is_active ? 'default' : 'secondary'}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      {canWrite && (
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => router.push(`/products/${p.id}/edit`)}>Edit</Button>
                          {canDelete && (
                            <Button size="sm" variant="destructive" onClick={() => { setDeleteTarget(p); setDeleteError('') }}>Delete</Button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="products" />

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {deleteError
              ? <p className="text-sm text-red-600">{deleteError}</p>
              : <p className="text-sm text-gray-600">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
            }
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteError('') }}>
                {deleteError ? 'Close' : 'Cancel'}
              </Button>
              {!deleteError && (
                <Button variant="destructive" disabled={deleteMutation.isPending}
                  onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
