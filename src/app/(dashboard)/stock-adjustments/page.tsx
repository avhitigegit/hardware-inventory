'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getStockAdjustments, createStockAdjustment } from '@/actions/stock-adjustments.actions'
import { getProducts } from '@/actions/products.actions'
import { stockAdjustmentSchema, type StockAdjustmentInput } from '@/lib/validations/stock-adjustment.schema'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'

export default function StockAdjustmentsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProductStock, setSelectedProductStock] = useState<number | null>(null)
  const [selectedProductUnit, setSelectedProductUnit] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['stock-adjustments', page],
    queryFn: async () => {
      const result = await getStockAdjustments({ page })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: productsData } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => {
      const r = await getProducts({ page: 1 })
      return r.data
    },
  })
  const allProducts = productsData?.products ?? []

  const adjustments = data?.adjustments ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const form = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: { product_id: 0, adjustment_type: 'ADD', quantity: 1, reason: '' },
  })

  const watchType = form.watch('adjustment_type')
  const watchQty = form.watch('quantity')
  const subtractExceeds = watchType === 'SUBTRACT' && selectedProductStock !== null && watchQty > selectedProductStock

  const createMutation = useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success('Stock adjustment recorded.')
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-all'] })
      setDialogOpen(false)
      form.reset()
      setSelectedProductStock(null)
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Adjustments</h1>
          <p className="text-sm text-gray-500">{total} records</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New Adjustment</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Reason</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Done By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              : adjustments.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">No adjustments recorded yet.</td>
                  </tr>
                )
              : adjustments.map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDateTime(a.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{a.product_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.adjustment_type === 'ADD' ? 'default' : 'destructive'}>
                        {a.adjustment_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{a.quantity} {a.product_unit}</td>
                    <td className="px-4 py-3 text-gray-600">{a.reason}</td>
                    <td className="px-4 py-3 text-gray-500">{a.done_by}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="adjustments" />

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { form.reset(); setSelectedProductStock(null) } setDialogOpen(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Stock Adjustment</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
              <FormField control={form.control} name="product_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Product *</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      value={field.value || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        field.onChange(val)
                        const product = allProducts.find((p: any) => p.id === val)
                        setSelectedProductStock(product?.stock_quantity ?? null)
                        setSelectedProductUnit(product?.unit ?? '')
                      }}>
                      <option value="">Select product</option>
                      {allProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Stock: {p.stock_quantity} {p.unit}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="adjustment_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      {(['ADD', 'SUBTRACT'] as const).map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value={type}
                            checked={field.value === type}
                            onChange={() => field.onChange(type)}
                            className="accent-blue-600" />
                          <span className={`text-sm font-medium ${type === 'ADD' ? 'text-green-600' : 'text-red-600'}`}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="quantity" render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *
                    {selectedProductStock !== null && (
                      <span className="text-gray-400 font-normal ml-2">
                        (Current stock: {selectedProductStock} {selectedProductUnit})
                      </span>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Input type="number" min="1"
                      {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                  </FormControl>
                  {subtractExceeds && (
                    <p className="text-sm text-red-500">
                      Cannot subtract {watchQty}. Only {selectedProductStock} units in stock.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason * <span className="text-gray-400 font-normal">(min 5 characters)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Damaged goods, stock count correction…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || subtractExceeds}>
                  {createMutation.isPending ? 'Saving…' : 'Submit'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
