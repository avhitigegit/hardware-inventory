'use server'

import { createClient } from '@/lib/supabase/server'
import { categorySchema, type CategoryInput } from '@/lib/validations/category.schema'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

export async function getCategories(): Promise<ActionResult<any[]>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('name')

  if (error) return { data: null, error: error.message }

  const categories = data.map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count ?? 0,
  }))

  return { data: categories, error: null }
}

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('categories').insert(parsed.data)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function updateCategory(id: number, input: CategoryInput): Promise<ActionResult> {
  const supabase = await createClient()
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { data: null, error: parsed.error.issues[0].message }

  const { error } = await supabase.from('categories').update(parsed.data).eq('id', id)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}

export async function deleteCategory(id: number): Promise<ActionResult> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return {
      data: null,
      error: 'Cannot delete a category that has products. Reassign or delete those products first.',
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { data: null, error: error.message }

  return { data: null, error: null }
}
