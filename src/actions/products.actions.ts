'use server'

import { createClient } from '@/lib/supabase/server'
import { productSchema, productCreateSchema, type ProductInput, type ProductCreateInput } from '@/lib/validations/product.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 20

export async function getProducts(filters?: {
  search?: string
  categoryId?: number
  lowStock?: boolean
  page?: number
}): Promise<ActionResult<{ products: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1

  if (filters?.lowStock) {
    const { data: all, error } = await supabase
      .from('products')
      .select('*, categories(name), suppliers(name)')
      .eq('is_active', true)
      .order('stock_quantity', { ascending: true })

    if (error) return { data: null, error: error.message }

    const filtered = (all ?? []).filter((p: any) => p.stock_quantity <= p.reorder_level)
    const from = (page - 1) * PAGE_SIZE
    return {
      data: { products: filtered.slice(from, from + PAGE_SIZE), total: filtered.length },
      error: null,
    }
  }

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('products')
    .select('*, categories(name), suppliers(name)', { count: 'exact' })
    .range(from, to)
    .order('name')

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  const { data, error, count } = await query

  if (error) return { data: null, error: error.message }
  return { data: { products: data ?? [], total: count ?? 0 }, error: null }
}

export async function getProductById(id: number): Promise<ActionResult<any>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), suppliers(name)')
    .eq('id', id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getAllProducts(): Promise<ActionResult<any[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), suppliers(name)')
    .eq('is_active', true)
    .order('name')
  if (error) return { data: null, error: error.message }
  return { data: data ?? [], error: null }
}

export async function getProductByBarcode(barcode: string): Promise<ActionResult<any>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', barcode)
    .eq('is_active', true)
    .single()

  if (error) return { data: null, error: 'Product not found.' }
  return { data, error: null }
}

export async function createProduct(input: ProductCreateInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = productCreateSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { initial_stock, ...productData } = parsed.data

  // Validate unique SKU
  const { count: skuCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('sku', productData.sku)

  if (skuCount && skuCount > 0) return { data: null, error: 'SKU already exists. Use a unique SKU.' }

  // Validate unique barcode if provided
  if (productData.barcode) {
    const { count: barcodeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('barcode', productData.barcode)

    if (barcodeCount && barcodeCount > 0) return { data: null, error: 'Barcode already exists.' }
  }

  const { error } = await supabase.from('products').insert({
    ...productData,
    barcode: productData.barcode || null,
    stock_quantity: initial_stock,
  })

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function updateProduct(id: number, input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  // Validate unique SKU (excluding current product)
  const { count: skuCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('sku', parsed.data.sku)
    .neq('id', id)

  if (skuCount && skuCount > 0) return { data: null, error: 'SKU already exists. Use a unique SKU.' }

  // Validate unique barcode if provided (excluding current product)
  if (parsed.data.barcode) {
    const { count: barcodeCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('barcode', parsed.data.barcode)
      .neq('id', id)

    if (barcodeCount && barcodeCount > 0) return { data: null, error: 'Barcode already exists.' }
  }

  const { error } = await supabase
    .from('products')
    .update({ ...parsed.data, barcode: parsed.data.barcode || null })
    .eq('id', id)

  if (error) return { data: null, error: error.message }
  return { data: null, error: null }
}

export async function deleteProduct(id: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { count: saleCount } = await supabase
    .from('sale_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id)

  if (saleCount && saleCount > 0) {
    return {
      data: null,
      error: 'Cannot delete a product with transaction history. Deactivate it instead (set status to Inactive).',
    }
  }

  const { count: purchaseCount } = await supabase
    .from('purchase_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', id)

  if (purchaseCount && purchaseCount > 0) {
    return {
      data: null,
      error: 'Cannot delete a product with transaction history. Deactivate it instead (set status to Inactive).',
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function checkSkuUnique(sku: string, excludeId?: number): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('sku', sku)

  if (excludeId) query = query.neq('id', excludeId)

  const { count } = await query
  return (count ?? 0) === 0
}
