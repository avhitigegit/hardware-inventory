'use client'

import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { getProductById, updateProduct } from '@/actions/products.actions'
import { getCategories } from '@/actions/categories.actions'
import { getSuppliers } from '@/actions/suppliers.actions'
import { productSchema, PRODUCT_UNITS, type ProductInput } from '@/lib/validations/product.schema'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const queryClient = useQueryClient()
  const id = Number(params.id)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const r = await getCategories(); return r.data ?? [] },
  })

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => { const r = await getSuppliers(); return r.data ?? [] },
  })

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const r = await getProductById(id)
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: undefined,
      supplier_id: null,
      unit: 'PCS',
      buying_price: 0,
      selling_price: 0,
      reorder_level: 5,
      is_active: true,
    },
    values: product ? {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? '',
      description: product.description ?? '',
      category_id: product.category_id ?? undefined,
      supplier_id: product.supplier_id ?? null,
      unit: product.unit as any,
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      reorder_level: product.reorder_level,
      is_active: product.is_active,
    } : undefined,
  })

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    const supabase = createClient()
    const ext = imageFile.name.split('.').pop()
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('product-images').upload(filename, imageFile)
    if (error) { toast.warning(`Image upload failed: ${error.message}. Product saved without new image.`); return null }
    const { data } = supabase.storage.from('product-images').getPublicUrl(filename)
    return data.publicUrl
  }

  const onSubmit = async (data: ProductInput) => {
    setSaving(true)
    if (data.selling_price < data.buying_price) {
      toast.warning('Selling price is less than buying price. Saving anyway.')
    }
    const newImageUrl = await uploadImage()
    const image_url = newImageUrl ?? product?.image_url ?? null
    const result = await updateProduct(id, { ...data, image_url } as any)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Product updated.')
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['product', id] })
    router.push(`/products/${id}`)
  }

  if (isLoading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )

  if (!product) return <p className="text-red-500">Product not found.</p>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button onClick={() => router.push(`/products/${id}`)} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Product</button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="barcode" render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl><Input placeholder="Optional" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <FormControl>
                    <select className="w-full rounded-md border px-3 py-2 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}>
                      <option value="">Select category</option>
                      {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supplier_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <select className="w-full rounded-md border px-3 py-2 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}>
                      <option value="">No supplier</option>
                      {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit *</FormLabel>
                  <FormControl>
                    <select className="w-full rounded-md border px-3 py-2 text-sm" {...field}>
                      {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select className="w-full rounded-md border px-3 py-2 text-sm"
                      value={field.value ? 'true' : 'false'}
                      onChange={(e) => field.onChange(e.target.value === 'true')}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="Optional description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pricing & Stock</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="buying_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Buying Price (Rs.) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0"
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="selling_price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price (Rs.) *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0"
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="reorder_level" render={({ field }) => (
                <FormItem>
                  <FormLabel>Reorder Level *</FormLabel>
                  <FormControl>
                    <Input type="number" min="0"
                      {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex flex-col justify-end pb-1">
                <p className="text-xs text-gray-500 mb-1">Current Stock</p>
                <p className="text-lg font-semibold">{product.stock_quantity} {product.unit}</p>
                <p className="text-xs text-gray-400">Change stock via GRN or Stock Adjustment</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(imagePreview ?? product.image_url) && (
                <img
                  src={imagePreview ?? product.image_url!}
                  alt="Product"
                  className="h-32 w-32 object-cover rounded-md border"
                />
              )}
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }} />
              <p className="text-xs text-gray-400">Upload a new image to replace the existing one.</p>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push(`/products/${id}`)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
