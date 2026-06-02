'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getProductByBarcode, getAllProducts } from '@/actions/products.actions'
import { getCustomers } from '@/actions/customers.actions'
import { createSale } from '@/actions/sales.actions'
import { useUser } from '@/hooks/useUser'
import { formatCurrency, formatQty, zeroPad } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'

const SaleReceiptDownload = dynamic(() => import('@/components/pdf/SaleReceiptDownload'), { ssr: false })

type CartItem = {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
}

type CompletedSale = {
  id: number
  subtotal: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  balance_amount: number
  payment_type: string
  customer_name: string | null
  amount_received?: number
  change?: number
  cash_amount?: number
  items: CartItem[]
}

export default function PosPage() {
  const { user } = useUser()
  const canEditPrice = user?.role && ['ADMIN', 'OWNER'].includes(user.role)
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT' | 'SPLIT'>('CASH')
  const [amountReceived, setAmountReceived] = useState<number>(0)
  const [cashAmount, setCashAmount] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [completing, setCompleting] = useState(false)
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)

  const focusBarcode = useCallback(() => {
    setTimeout(() => barcodeRef.current?.focus(), 100)
  }, [])

  useEffect(() => { focusBarcode() }, [focusBarcode])

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await getCustomers(); return r.data ?? [] },
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => { const r = await getAllProducts(); return r.data ?? [] },
  })

  const filteredProducts = productSearch.length >= 2
    ? allProducts.filter((p: any) =>
        p.is_active &&
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
         p.sku.toLowerCase().includes(productSearch.toLowerCase()))
      ).slice(0, 8)
    : []

  const addToCart = (product: any) => {
    if (!product.is_active) { toast.error(`${product.name} is not available for sale.`); return }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: product.selling_price }]
    })
    setProductSearch('')
    setShowProductDropdown(false)
    focusBarcode()
  }

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    const result = await getProductByBarcode(barcodeInput.trim())
    setBarcodeInput('')
    if (result.error || !result.data) {
      toast.error(`Product not found for barcode: ${barcodeInput.trim()}`)
      return
    }
    addToCart(result.data)
  }

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i))
  }

  const updateCartPrice = (productId: number, price: number) => {
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, unit_price: price } : i))
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(i => i.product_id !== productId))
  }

  const cartSubtotal = cart.reduce((sum, i) => sum + i.quantity * i.unit_price, 0)
  const safeDiscount = Math.min(discountAmount, cartSubtotal)
  const cartTotal = Math.max(0, cartSubtotal - safeDiscount)
  const change = paymentType === 'CASH' ? Math.max(0, amountReceived - cartTotal) : 0
  const creditPortion = paymentType === 'SPLIT' ? Math.max(0, cartTotal - cashAmount) : 0
  const selectedCustomer = customersData.find((c: any) => c.id === customerId) as any

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error('Cart is empty.'); return }
    if (paymentType === 'CREDIT' && !customerId) { toast.error('Select a customer for credit sales.'); return }
    if (paymentType === 'SPLIT' && !customerId) { toast.error('Select a customer for split payment sales.'); return }
    if (paymentType === 'CASH' && amountReceived < cartTotal) {
      toast.error(`Amount received is less than total. Total: ${formatCurrency(cartTotal)}`); return
    }
    if (paymentType === 'SPLIT') {
      if (cashAmount <= 0) { toast.error('Enter cash amount for split payment.'); return }
      if (cashAmount >= cartTotal) { toast.error('Cash amount must be less than total. Use CASH instead.'); return }
    }
    setCompleting(true)
    const result = await createSale({
      customer_id: customerId ? Number(customerId) : null,
      payment_type: paymentType,
      discount_amount: safeDiscount,
      amount_received: paymentType === 'CASH' ? amountReceived : undefined,
      cash_amount: paymentType === 'SPLIT' ? cashAmount : undefined,
      items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price })),
    })
    setCompleting(false)
    if (result.error) { toast.error(result.error); return }

    setCompletedSale({
      id: result.data!.id,
      subtotal: cartSubtotal,
      discount_amount: safeDiscount,
      total_amount: cartTotal,
      paid_amount: paymentType === 'CASH' ? cartTotal : paymentType === 'SPLIT' ? cashAmount : 0,
      balance_amount: paymentType === 'CREDIT' ? cartTotal : paymentType === 'SPLIT' ? creditPortion : 0,
      payment_type: paymentType,
      customer_name: selectedCustomer?.name ?? null,
      amount_received: paymentType === 'CASH' ? amountReceived : undefined,
      change: paymentType === 'CASH' ? change : undefined,
      cash_amount: paymentType === 'SPLIT' ? cashAmount : undefined,
      items: [...cart],
    })
    toast.success('Sale completed.')
  }

  const handleNewSale = () => {
    setCart([])
    setCompletedSale(null)
    setCustomerId('')
    setPaymentType('CASH')
    setAmountReceived(0)
    setCashAmount(0)
    setDiscountAmount(0)
    setProductSearch('')
    focusBarcode()
  }

  if (completedSale) {
    return (
      <div className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="text-4xl mb-2">✓</div>
          <h1 className="text-2xl font-bold text-green-700">Sale Complete</h1>
          <p className="text-gray-500">Receipt #{zeroPad(completedSale.id, 6)}</p>
        </div>

        <div className="rounded-lg border bg-white p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium">{completedSale.customer_name ?? 'Walk-in Customer'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Payment Type</span>
            <Badge variant={completedSale.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{completedSale.payment_type}</Badge>
          </div>
          <div className="border-t pt-3 space-y-1">
            {completedSale.items.map((item, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-600">
                <span>{item.product_name} × {formatQty(item.quantity)}</span>
                <span>{formatCurrency(item.quantity * item.unit_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1">
            {completedSale.discount_amount > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>− {formatCurrency(completedSale.discount_amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(completedSale.total_amount)}</span>
            </div>
            {completedSale.payment_type === 'CASH' && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Received</span>
                  <span>{formatCurrency(completedSale.amount_received ?? 0)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold text-base">
                  <span>Change</span>
                  <span>{formatCurrency(completedSale.change ?? 0)}</span>
                </div>
              </>
            )}
            {completedSale.payment_type === 'CREDIT' && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>On Credit</span>
                <span>{formatCurrency(completedSale.balance_amount)}</span>
              </div>
            )}
            {completedSale.payment_type === 'SPLIT' && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Paid</span>
                  <span>{formatCurrency(completedSale.cash_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-medium">
                  <span>On Credit</span>
                  <span>{formatCurrency(completedSale.balance_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <SaleReceiptDownload saleId={completedSale.id} />
          <Button className="flex-1" onClick={handleNewSale}>New Sale</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left — Cart */}
      <div className="flex-1 flex flex-col bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">Cart</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Scan a barcode or search for a product to start
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Product</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Qty</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Unit Price</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600 w-24">Total</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-3 py-2 font-medium">{item.product_name}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number" min="0.001" step="0.001" className="w-20 text-right ml-auto"
                        value={item.quantity}
                        onChange={(e) => updateCartQty(item.product_id, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number" step="0.01" min="0" className="w-20 text-right ml-auto"
                        value={item.unit_price}
                        disabled={!canEditPrice}
                        onChange={(e) => updateCartPrice(item.product_id, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600 text-lg">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t px-4 py-3 bg-gray-50 space-y-1">
          {safeDiscount > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount</span>
                <span>− {formatCurrency(safeDiscount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>
      </div>

      {/* Right — Add Products + Payment */}
      <div className="w-80 flex flex-col gap-4">
        {/* Barcode + Search */}
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Barcode Scanner</label>
            <form onSubmit={handleBarcodeSubmit}>
              <Input
                ref={barcodeRef}
                placeholder="Scan or type barcode…"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoComplete="off"
              />
            </form>
          </div>
          <div className="relative">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Product Search</label>
            <Input
              placeholder="Search by name or SKU…"
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
              onFocus={() => setShowProductDropdown(true)}
              autoComplete="off"
            />
            {showProductDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                    onMouseDown={() => addToCart(p)}
                  >
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-400">{p.sku} · Stock: {formatQty(p.stock_quantity)} · {formatCurrency(p.selling_price)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Discount */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Discount (Rs.)</label>
            <Input
              type="number" step="0.01" min="0"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Customer</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Walk-in Customer</option>
              {customersData.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Type</label>
            <div className="flex gap-3 flex-wrap">
              {(['CASH', 'CREDIT', 'SPLIT'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="payment_type_pos" value={type}
                    checked={paymentType === type}
                    onChange={() => setPaymentType(type)}
                    className="accent-blue-600" />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
            {(paymentType === 'CREDIT' || paymentType === 'SPLIT') && !customerId && (
              <p className="text-xs text-red-500 mt-1">Customer required for {paymentType.toLowerCase()} sales</p>
            )}
          </div>

          {paymentType === 'CASH' && (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount Received (Rs.)</label>
                <Input
                  type="number" step="0.01" min="0"
                  value={amountReceived || ''}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Change</span>
                <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(change)}</span>
              </div>
            </div>
          )}

          {paymentType === 'SPLIT' && (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cash Amount (Rs.)</label>
                <Input
                  type="number" step="0.01" min="0"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-sm font-medium text-amber-600">
                <span>On Credit</span>
                <span>{formatCurrency(creditPortion)}</span>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={completing || cart.length === 0}
            onClick={handleCompleteSale}
          >
            {completing ? 'Processing…' : 'Complete Sale'}
          </Button>
        </div>
      </div>
    </div>
  )
}
