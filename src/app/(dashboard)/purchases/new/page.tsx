'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getSuppliers } from '@/actions/suppliers.actions'
import { getProducts } from '@/actions/products.actions'
import { createPurchase } from '@/actions/purchases.actions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LineItem = {
  product_id: number
  product_name: string
  unit: string
  buying_price: number
  quantity: number
  unit_price: number
}

export default function NewPurchasePage() {
  const router = useRouter()
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => { const r = await getSuppliers(); return r.data ?? [] },
  })

  const { data: productsData } = useQuery({
    queryKey: ['products', '', undefined, false, 1],
    queryFn: async () => {
      const r = await getProducts({ page: 1 })
      return r.data
    },
  })
  const allProducts = productsData?.products ?? []

  const addItem = () => {
    setItems(prev => [...prev, { product_id: 0, product_name: '', unit: '', buying_price: 0, quantity: 1, unit_price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (field === 'product_id') {
        const product = allProducts.find((p: any) => p.id === Number(value))
        if (product) {
          return { ...item, product_id: product.id, product_name: product.name, unit: product.unit, buying_price: product.buying_price, unit_price: product.buying_price }
        }
        return { ...item, product_id: 0, product_name: '', unit: '', buying_price: 0, unit_price: 0 }
      }
      return { ...item, [field]: value }
    }))
  }

  const grandTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  const validate = (): string[] => {
    const errs: string[] = []
    if (!supplierId) errs.push('Select a supplier.')
    if (items.length === 0) errs.push('Add at least one item.')
    items.forEach((item, i) => {
      if (!item.product_id) errs.push(`Row ${i + 1}: Select a product.`)
      if (item.quantity <= 0) errs.push(`Row ${i + 1}: Quantity must be > 0.`)
      if (item.unit_price <= 0) errs.push(`Row ${i + 1}: Unit price must be > 0.`)
    })
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])
    setSaving(true)

    const result = await createPurchase({
      supplier_id: Number(supplierId),
      invoice_number: invoiceNumber || undefined,
      payment_type: paymentType,
      notes: notes || undefined,
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })

    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`GRN created. Stock updated for ${items.length} product${items.length > 1 ? 's' : ''}.`)
    router.push(`/purchases/${result.data!.id}`)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <button onClick={() => router.push('/purchases')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to GRN List</button>
        <h1 className="text-2xl font-bold text-gray-800">New GRN</h1>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>GRN Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Supplier *</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select supplier</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Invoice Number</label>
            <Input placeholder="Optional" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Type *</label>
            <div className="flex gap-3">
              {(['CASH', 'CREDIT'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payment_type" value={type}
                    checked={paymentType === type}
                    onChange={() => setPaymentType(type)}
                    className="accent-blue-600" />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No items added. Click "Add Item" to start.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <span className="col-span-4">Product</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-2 text-right">Unit Price (Rs.)</span>
                <span className="col-span-2 text-right">Line Total</span>
                <span className="col-span-1"></span>
              </div>
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-4">
                    <select
                      className="w-full rounded-md border px-2 py-1.5 text-sm"
                      value={item.product_id || ''}
                      onChange={(e) => updateItem(index, 'product_id', e.target.value)}>
                      <option value="">Select product</option>
                      {allProducts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) — Stock: {p.stock_quantity}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" min="1" className="text-right"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number" step="0.01" min="0" className="text-right"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 text-lg leading-none">×</button>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Grand Total</p>
                  <p className="text-xl font-bold">{formatCurrency(grandTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/purchases')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Submitting…' : 'Submit GRN'}</Button>
      </div>
    </div>
  )
}
