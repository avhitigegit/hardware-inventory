'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getProductByBarcode, getAllProducts } from '@/actions/products.actions'
import { getCustomers } from '@/actions/customers.actions'
import { createSale } from '@/actions/sales.actions'
import { useUser } from '@/hooks/useUser'
import { formatCurrency, formatQty, zeroPad } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

const SaleReceiptDownload = dynamic(() => import('@/components/pdf/SaleReceiptDownload'), { ssr: false })

type CartItem = {
  product_id:   number
  product_name: string
  original_price: number   // original selling price — never changes
  unit_price:   number     // editable by admin/owner
  discount_pct: number     // per-item discount %
  quantity:     number
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
  items: { name: string; qty: number; unit_price: number; total: number; discount_pct: number }[]
}

const paymentActive = {
  CASH:   'bg-green-500 border-green-500 text-white shadow-md shadow-green-900/20',
  CREDIT: 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-900/20',
  SPLIT:  'bg-blue-500  border-blue-500  text-white shadow-md shadow-blue-900/20',
}
const paymentIdle = {
  CASH:   'border-gray-600 text-gray-400 hover:border-green-500 hover:text-green-400',
  CREDIT: 'border-gray-600 text-gray-400 hover:border-amber-500 hover:text-amber-400',
  SPLIT:  'border-gray-600 text-gray-400 hover:border-blue-500  hover:text-blue-400',
}

// effective price after per-item discount
const effectivePrice = (item: CartItem) =>
  Math.round(item.unit_price * (1 - item.discount_pct / 100) * 100) / 100

// line total after per-item discount
const lineTotal = (item: CartItem) =>
  Math.round(item.quantity * effectivePrice(item) * 100) / 100

export default function PosPage() {
  const { user } = useUser()
  const canEditPrice = user?.role && ['ADMIN', 'OWNER'].includes(user.role)

  const [cart, setCart]                     = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput]     = useState('')
  const [productSearch, setProductSearch]   = useState('')
  const [showDropdown, setShowDropdown]     = useState(false)
  const [customerId, setCustomerId]         = useState<number | ''>('')
  const [paymentType, setPaymentType]       = useState<'CASH' | 'CREDIT' | 'SPLIT'>('CASH')
  const [amountReceived, setAmountReceived] = useState<number>(0)
  const [cashAmount, setCashAmount]         = useState<number>(0)
  const [completing, setCompleting]         = useState(false)
  const [completedSale, setCompletedSale]   = useState<CompletedSale | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  const focusBarcode        = useCallback(() => { setTimeout(() => barcodeRef.current?.focus(), 100) }, [])
  const focusProductSearch  = useCallback(() => { setTimeout(() => searchRef.current?.focus(),  100) }, [])

  useEffect(() => { focusProductSearch() }, [focusProductSearch])

  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => { const r = await getCustomers(); return r.data ?? [] },
  })

  const { data: allProducts = [] } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => { const r = await getAllProducts(); return r.data ?? [] },
  })

  const filteredProducts = productSearch.length >= 1
    ? allProducts.filter((p: any) =>
        p.is_active &&
        (p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
         p.sku.toLowerCase().includes(productSearch.toLowerCase()))
      ).slice(0, 10)
    : []

  const addToCart = (product: any) => {
    if (!product.is_active) { toast.error(`${product.name} is not available.`); return }
    if (product.stock_quantity <= 0) { toast.error(`${product.name} is out of stock.`); return }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, {
        product_id:     product.id,
        product_name:   product.name,
        original_price: product.selling_price,
        unit_price:     product.selling_price,
        discount_pct:   0,
        quantity:       1,
      }]
    })
    setProductSearch('')
    setShowDropdown(false)
    focusProductSearch()
  }

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    const result = await getProductByBarcode(barcodeInput.trim())
    setBarcodeInput('')
    if (result.error || !result.data) { toast.error(`Barcode not found: ${barcodeInput.trim()}`); return }
    addToCart(result.data)
  }

  const updateQty      = (id: number, qty: number)     => { if (qty <= 0) removeItem(id); else setCart(p => p.map(i => i.product_id === id ? { ...i, quantity: qty } : i)) }
  const updatePrice    = (id: number, price: number)   => setCart(p => p.map(i => i.product_id === id ? { ...i, unit_price: price } : i))
  const updateDiscount = (id: number, pct: number)     => setCart(p => p.map(i => i.product_id === id ? { ...i, discount_pct: Math.min(100, Math.max(0, pct)) } : i))
  const removeItem     = (id: number)                  => setCart(p => p.filter(i => i.product_id !== id))

  const cartSubtotal    = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const totalDiscount   = cart.reduce((s, i) => s + (i.quantity * i.unit_price * i.discount_pct / 100), 0)
  const cartTotal       = Math.max(0, cartSubtotal - totalDiscount)
  const change          = paymentType === 'CASH'  ? Math.max(0, amountReceived - cartTotal) : 0
  const creditPortion   = paymentType === 'SPLIT' ? Math.max(0, cartTotal - cashAmount)     : 0
  const selectedCustomer = customersData.find((c: any) => c.id === customerId) as any

  const handleCompleteSale = async () => {
    if (cart.length === 0)                                       { toast.error('Cart is empty.'); return }
    if (paymentType === 'CREDIT' && !customerId)                 { toast.error('Select a customer for credit sales.'); return }
    if (paymentType === 'SPLIT'  && !customerId)                 { toast.error('Select a customer for split payment.'); return }
    if (paymentType === 'CASH'   && amountReceived < cartTotal)  { toast.error(`Amount received is less than total (${formatCurrency(cartTotal)}).`); return }
    if (paymentType === 'SPLIT'  && cashAmount <= 0)             { toast.error('Enter cash amount for split payment.'); return }
    if (paymentType === 'SPLIT'  && cashAmount >= cartTotal)     { toast.error('Cash amount must be less than total. Use CASH instead.'); return }

    setCompleting(true)
    const result = await createSale({
      customer_id:     customerId ? Number(customerId) : null,
      payment_type:    paymentType,
      discount_amount: Math.round(totalDiscount * 100) / 100,
      amount_received: paymentType === 'CASH'  ? amountReceived : undefined,
      cash_amount:     paymentType === 'SPLIT' ? cashAmount     : undefined,
      // send effective (discounted) price as unit_price so DB totals are accurate
      items: cart.map(i => ({
        product_id:   i.product_id,
        product_name: i.product_name,
        quantity:     i.quantity,
        unit_price:   effectivePrice(i),
      })),
    })
    setCompleting(false)
    if (result.error) { toast.error(result.error); return }

    setCompletedSale({
      id: result.data!.id,
      subtotal: cartSubtotal,
      discount_amount: Math.round(totalDiscount * 100) / 100,
      total_amount: cartTotal,
      paid_amount:    paymentType === 'CASH'   ? cartTotal    : paymentType === 'SPLIT' ? cashAmount    : 0,
      balance_amount: paymentType === 'CREDIT' ? cartTotal    : paymentType === 'SPLIT' ? creditPortion : 0,
      payment_type: paymentType,
      customer_name: selectedCustomer?.name ?? null,
      amount_received: paymentType === 'CASH'  ? amountReceived : undefined,
      change:          paymentType === 'CASH'  ? change         : undefined,
      cash_amount:     paymentType === 'SPLIT' ? cashAmount     : undefined,
      items: cart.map(i => ({
        name:         i.product_name,
        qty:          i.quantity,
        unit_price:   effectivePrice(i),
        total:        lineTotal(i),
        discount_pct: i.discount_pct,
      })),
    })
    toast.success('Sale completed!')
  }

  const handleNewSale = () => {
    setCart([]); setCompletedSale(null); setCustomerId('')
    setPaymentType('CASH'); setAmountReceived(0); setCashAmount(0)
    setProductSearch(''); focusProductSearch()
  }

  // ── POST-SALE SCREEN ──────────────────────────────────────────────────────
  if (completedSale) {
    return (
      <div className="max-w-md mx-auto py-8 space-y-5">
        <div className="rounded-2xl bg-green-600 text-white px-6 py-7 text-center shadow-xl">
          <div className="text-6xl mb-3">✓</div>
          <p className="text-2xl font-bold">Sale Complete!</p>
          <p className="text-green-200 text-sm mt-1">Receipt #{zeroPad(completedSale.id, 6)}</p>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden text-sm">
          <div className="px-5 py-3 bg-gray-50 border-b flex justify-between">
            <span className="text-gray-500">Customer</span>
            <span className="font-semibold">{completedSale.customer_name ?? 'Walk-in'}</span>
          </div>
          <div className="px-5 py-2 divide-y">
            {completedSale.items.map((item, i) => (
              <div key={i} className="flex justify-between py-2.5 text-xs">
                <div>
                  <span className="text-gray-700 font-medium">{item.name}</span>
                  <span className="text-gray-400 font-normal ml-1">× {formatQty(item.qty)}</span>
                  {item.discount_pct > 0 && (
                    <span className="ml-1.5 bg-green-100 text-green-700 rounded px-1 py-0.5 text-[10px] font-semibold">
                      {item.discount_pct}% off
                    </span>
                  )}
                </div>
                <span className="font-semibold">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t space-y-1.5">
            {completedSale.discount_amount > 0 && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span><span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount</span><span>− {formatCurrency(completedSale.discount_amount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total</span><span>{formatCurrency(completedSale.total_amount)}</span>
            </div>
            {completedSale.payment_type === 'CASH' && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Received</span><span>{formatCurrency(completedSale.amount_received ?? 0)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-bold text-lg">
                  <span>Change</span><span>{formatCurrency(completedSale.change ?? 0)}</span>
                </div>
              </>
            )}
            {completedSale.payment_type === 'CREDIT' && (
              <div className="flex justify-between text-amber-600 font-semibold">
                <span>On Credit</span><span>{formatCurrency(completedSale.balance_amount)}</span>
              </div>
            )}
            {completedSale.payment_type === 'SPLIT' && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Cash Paid</span><span>{formatCurrency(completedSale.cash_amount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-semibold">
                  <span>On Credit</span><span>{formatCurrency(completedSale.balance_amount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <SaleReceiptDownload saleId={completedSale.id} />
          <button onClick={handleNewSale}
            className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors">
            + New Sale
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN POS SCREEN ───────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">

      {/* ── LEFT: CART ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col rounded-2xl border bg-white overflow-hidden shadow-sm">

        {/* Header */}
        <div className="px-5 py-3 border-b bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-gray-800">Cart</h2>
            {cart.length > 0 && (
              <span className="bg-gray-900 text-white text-xs font-bold rounded-full px-2.5 py-0.5">{cart.length}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])}
              className="text-xs text-red-400 hover:text-red-600 font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear all
            </button>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-gray-400 font-medium text-sm">Cart is empty</p>
                <p className="text-gray-300 text-xs mt-1">Scan a barcode or search a product</p>
              </div>
            </div>
          ) : (
            cart.map((item, idx) => {
              const ep   = effectivePrice(item)
              const lt   = lineTotal(item)
              const hasDiscount = item.discount_pct > 0
              const hasPriceEdit = canEditPrice && item.unit_price !== item.original_price

              return (
                <div key={item.product_id}
                  className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  {/* Row 1 — name + total + remove */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{item.product_name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(lt)}</p>
                        {hasDiscount && (
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(item.quantity * item.unit_price)}</p>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.product_id)}
                        className="w-6 h-6 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Row 2 — price / qty / discount controls */}
                  <div className="flex items-center gap-3 flex-wrap">

                    {/* Unit price (editable for Admin/Owner) */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Price</span>
                      {canEditPrice ? (
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">Rs.</span>
                          <input
                            type="number" step="0.01" min="0"
                            value={item.unit_price}
                            onChange={e => updatePrice(item.product_id, parseFloat(e.target.value) || 0)}
                            className="w-24 h-7 pl-7 pr-1 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-gray-600">{formatCurrency(item.unit_price)}</span>
                      )}
                      {hasPriceEdit && (
                        <span className="text-[10px] text-blue-500 font-medium">(edited)</span>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item.product_id, Math.round((item.quantity - 1) * 1000) / 1000)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">
                        −
                      </button>
                      <input
                        type="number" min="0.001" step="0.001"
                        value={item.quantity}
                        onChange={e => updateQty(item.product_id, parseFloat(e.target.value) || 0)}
                        className="w-14 h-6 text-center text-xs font-semibold bg-white border border-gray-200 rounded-md focus:outline-none focus:border-blue-400"
                      />
                      <button onClick={() => updateQty(item.product_id, Math.round((item.quantity + 1) * 1000) / 1000)}
                        className="w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-sm font-bold transition-colors">
                        +
                      </button>
                    </div>

                    {/* Per-item discount */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs text-gray-400">Disc</span>
                      <div className="relative">
                        <input
                          type="number" step="0.5" min="0" max="100"
                          value={item.discount_pct || ''}
                          onChange={e => updateDiscount(item.product_id, parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-14 h-7 pr-5 pl-2 text-xs text-center bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                      </div>
                      {[5, 10, 15].map(pct => (
                        <button key={pct}
                          onClick={() => updateDiscount(item.product_id, item.discount_pct === pct ? 0 : pct)}
                          className={cn(
                            'h-7 px-1.5 rounded-md text-[10px] font-bold border transition-colors',
                            item.discount_pct === pct
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600'
                          )}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discount summary line */}
                  {hasDiscount && (
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-green-600">
                      <span className="bg-green-100 rounded px-1.5 py-0.5 font-semibold">{item.discount_pct}% off</span>
                      <span>{formatCurrency(item.unit_price)} → {formatCurrency(ep)} each</span>
                      <span className="text-green-500">save {formatCurrency(item.quantity * item.unit_price * item.discount_pct / 100)}</span>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer totals */}
        <div className="border-t bg-white px-5 py-4 space-y-2">
          {totalDiscount > 0 && (
            <>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal (original prices)</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Total Discount</span>
                <span>− {formatCurrency(totalDiscount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-200">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total</span>
            <span className="text-3xl font-black text-gray-900">{formatCurrency(cartTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: SEARCH + PAYMENT ──────────────────────────────────────── */}
      <div className="w-[300px] flex flex-col gap-3">

        {/* Search panel */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Barcode Scanner</label>
            <form onSubmit={handleBarcodeSubmit}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <Input ref={barcodeRef} placeholder="Scan or type barcode…" value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)} autoComplete="off" className="pl-9" />
              </div>
            </form>
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Product Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input ref={searchRef} placeholder="Search by name or SKU…" value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)} autoComplete="off" className="pl-9" />
            </div>
            {showDropdown && filteredProducts.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border rounded-xl shadow-2xl max-h-56 overflow-y-auto">
                {filteredProducts.map((p: any) => (
                  <button key={p.id} className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b last:border-0 transition-colors"
                    onMouseDown={() => addToCart(p)}>
                    <div className="font-semibold text-gray-800 text-sm leading-tight">{p.name}</div>
                    <div className="flex gap-2 mt-0.5 text-xs">
                      <span className="text-gray-400">{p.sku}</span>
                      <span className="text-gray-300">·</span>
                      <span className={p.stock_quantity <= 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                        Stock: {formatQty(p.stock_quantity)}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-blue-600 font-semibold">{formatCurrency(p.selling_price)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment panel */}
        <div className="bg-gray-900 rounded-2xl shadow-sm p-4 flex flex-col gap-3 flex-1 overflow-y-auto">

          {/* Customer */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Customer</label>
            <select className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-gray-500"
              value={customerId} onChange={e => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Walk-in Customer</option>
              {customersData.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Payment type */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Payment Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['CASH', 'CREDIT', 'SPLIT'] as const).map(type => (
                <button key={type} onClick={() => setPaymentType(type)}
                  className={cn('py-2.5 rounded-xl text-xs font-bold border transition-all',
                    paymentType === type ? paymentActive[type] : paymentIdle[type])}>
                  {type}
                </button>
              ))}
            </div>
            {(paymentType === 'CREDIT' || paymentType === 'SPLIT') && !customerId && (
              <p className="text-xs text-red-400 mt-1.5">⚠ Customer required</p>
            )}
          </div>

          {/* Cash received */}
          {paymentType === 'CASH' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Amount Received (Rs.)</label>
              <Input type="number" step="0.01" min="0"
                value={amountReceived || ''} onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
                placeholder="0.00" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              <div className="flex justify-between rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2.5">
                <span className="text-green-400 text-sm font-bold">Change</span>
                <span className="text-green-300 font-black text-lg">{formatCurrency(change)}</span>
              </div>
            </div>
          )}

          {/* Split cash */}
          {paymentType === 'SPLIT' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Cash Amount (Rs.)</label>
              <Input type="number" step="0.01" min="0"
                value={cashAmount || ''} onChange={e => setCashAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00" className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500" />
              <div className="flex justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
                <span className="text-amber-400 text-sm font-bold">On Credit</span>
                <span className="text-amber-300 font-black text-lg">{formatCurrency(creditPortion)}</span>
              </div>
            </div>
          )}

          {/* Complete Sale */}
          <button onClick={handleCompleteSale} disabled={completing || cart.length === 0}
            className={cn(
              'w-full py-4 rounded-2xl font-black text-base transition-all mt-auto',
              cart.length === 0 || completing
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white shadow-xl shadow-green-900/30'
            )}>
            {completing
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Processing…
                </span>
              : <>
                  Complete Sale
                  {cart.length > 0 && <span className="block text-green-200 font-semibold text-sm mt-0.5">{formatCurrency(cartTotal)}</span>}
                </>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
