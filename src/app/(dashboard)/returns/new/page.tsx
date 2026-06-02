'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getAllProducts } from '@/actions/products.actions'
import { getCustomers } from '@/actions/customers.actions'
import { createReturn } from '@/actions/returns.actions'
import { formatCurrency, formatQty } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ReturnLine = {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

export default function NewReturnPage() {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [returnMethod, setReturnMethod] = useState<'CASH_REFUND' | 'CREDIT_ADJUSTMENT'>('CASH_REFUND')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ReturnLine[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => { const r = await getAllProducts(); return r.data ?? [] },
  })

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await getCustomers(); return r.data ?? [] },
  })

  const addLine = () => {
    setItems(prev => [...prev, { product_id: 0, product_name: '', quantity: 1, unit_price: 0 }])
  }

  const removeLine = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const updateLine = (index: number, field: keyof ReturnLine, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'product_id') {
        const product = allProducts.find((p: any) => p.id === Number(value))
        if (product) return { ...item, product_id: product.id, product_name: product.name, unit_price: product.selling_price }
        return { ...item, product_id: 0, product_name: '', unit_price: 0 }
      }
      return { ...item, [field]: value }
    }))
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)

  const validate = (): string[] => {
    const errs: string[] = []
    if (items.length === 0) errs.push('Add at least one item.')
    if (returnMethod === 'CREDIT_ADJUSTMENT' && !customerId) errs.push('Customer required for credit adjustment.')
    items.forEach((item, i) => {
      if (!item.product_id) errs.push(`Row ${i + 1}: Select a product.`)
      if (item.quantity <= 0) errs.push(`Row ${i + 1}: Quantity must be > 0.`)
      if (item.unit_price <= 0) errs.push(`Row ${i + 1}: Price must be > 0.`)
    })
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setSaving(true)
    const result = await createReturn({
      customer_id: customerId ? Number(customerId) : null,
      return_method: returnMethod,
      notes: notes || undefined,
      items: items.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })),
    })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Return recorded. Stock updated.')
    router.push('/returns')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => router.push('/returns')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Returns</button>
        <h1 className="text-2xl font-bold text-gray-800">New Return</h1>
        <p className="text-sm text-gray-500">Returned items are automatically added back to stock.</p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Return Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Return Method *</label>
            <div className="flex gap-4 pt-1">
              {(['CASH_REFUND', 'CREDIT_ADJUSTMENT'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={m} checked={returnMethod === m}
                    onChange={() => setReturnMethod(m)} className="accent-blue-600" />
                  <span className="text-sm">{m === 'CASH_REFUND' ? 'Cash Refund' : 'Credit Adjustment'}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {returnMethod === 'CASH_REFUND'
                ? 'Give cash back to the customer.'
                : 'Reduce the customer\'s outstanding credit balance.'}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Customer {returnMethod === 'CREDIT_ADJUSTMENT' ? '*' : '(optional)'}
            </label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select customer</option>
              {customersData.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <Input placeholder="Reason for return (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Returned Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLine}>+ Add Item</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No items added. Click "Add Item" to start.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <span className="col-span-5">Product</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Unit Price (Rs.)</span>
                <span className="col-span-2 text-right">Line Total</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      className="w-full rounded-md border px-2 py-1.5 text-sm"
                      value={item.product_id || ''}
                      onChange={(e) => updateLine(index, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {allProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input type="number" min="0.001" step="0.001" className="text-right"
                      value={item.quantity}
                      onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" step="0.01" min="0" className="text-right"
                      value={item.unit_price}
                      onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total Return Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(total)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/returns')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Submit Return'}</Button>
      </div>
    </div>
  )
}
