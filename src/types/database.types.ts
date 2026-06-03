export type UserRole = 'ADMIN' | 'OWNER' | 'CASHIER' | 'STORE_KEEPER'

export type AppUser = {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  birthday: string | null
  address: string | null
  id_number: string | null
  mobile: string | null
  avatar_url: string | null
}

export type Category = {
  id: number
  name: string
  description: string | null
  created_at: string
}

export type Supplier = {
  id: number
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  credit_balance: number
  created_at: string
}

export type Customer = {
  id: number
  name: string
  phone: string | null
  email: string | null
  address: string | null
  credit_limit: number
  credit_balance: number
  created_at: string
}

export type Product = {
  id: number
  name: string
  sku: string
  barcode: string | null
  description: string | null
  category_id: number | null
  supplier_id: number | null
  unit: string
  buying_price: number
  selling_price: number
  stock_quantity: number
  reorder_level: number
  image_url: string | null
  is_active: boolean
  created_at: string
}

export type Purchase = {
  id: number
  supplier_id: number | null
  invoice_number: string | null
  total_amount: number
  payment_type: 'CASH' | 'CREDIT'
  notes: string | null
  created_by: string | null
  created_at: string
}

export type PurchaseItem = {
  id: number
  purchase_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
}

export type Sale = {
  id: number
  customer_id: number | null
  total_amount: number
  paid_amount: number
  balance_amount: number
  discount_amount: number
  payment_type: 'CASH' | 'CREDIT' | 'SPLIT'
  notes: string | null
  created_by: string | null
  created_at: string
}

export type Return = {
  id: number
  sale_id: number | null
  customer_id: number | null
  total_return_amount: number
  return_method: 'CASH_REFUND' | 'CREDIT_ADJUSTMENT'
  notes: string | null
  created_by: string | null
  created_at: string
}

export type ReturnItem = {
  id: number
  return_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
}

export type SaleItem = {
  id: number
  sale_id: number
  product_id: number
  quantity: number
  unit_price: number
  total_price: number
}

export type StockAdjustment = {
  id: number
  product_id: number
  adjustment_type: 'ADD' | 'SUBTRACT'
  quantity: number
  reason: string
  created_by: string | null
  created_at: string
}

export type CustomerPayment = {
  id: number
  customer_id: number
  amount: number
  notes: string | null
  created_by: string | null
  created_at: string
}

export type SupplierPayment = {
  id: number
  supplier_id: number
  amount: number
  notes: string | null
  created_by: string | null
  created_at: string
}
