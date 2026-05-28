'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/actions/categories.actions'
import { categorySchema, type CategoryInput } from '@/lib/validations/category.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/useUser'

type Category = { id: number; name: string; description: string | null; product_count: number }

export default function CategoriesPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories()
      if (result.error) throw new Error(result.error)
      return result.data as Category[]
    },
  })

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  })

  const openAdd = () => {
    setEditing(null)
    form.reset({ name: '', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    form.reset({ name: cat.name, description: cat.description ?? '' })
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (input: CategoryInput) =>
      editing ? updateCategory(editing.id, input) : createCategory(input),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(editing ? 'Category updated.' : 'Category created.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDialogOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: (result) => {
      if (result.error) { setDeleteError(result.error); return }
      toast.success('Category deleted.')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteTarget(null)
      setDeleteError('')
    },
  })

  const canWrite = user?.role && ['ADMIN', 'OWNER'].includes(user.role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        {canWrite && <Button onClick={openAdd}>Add Category</Button>}
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Products</th>
              {canWrite && <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                    {canWrite && <td className="px-4 py-3"><Skeleton className="h-8 w-32 ml-auto" /></td>}
                  </tr>
                ))
              : categories.length === 0
              ? (
                  <tr>
                    <td colSpan={canWrite ? 4 : 3} className="px-4 py-12 text-center text-gray-400">
                      No categories yet. Add your first category.
                    </td>
                  </tr>
                )
              : categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{cat.name}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{cat.product_count}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setDeleteTarget(cat); setDeleteError('') }}>Delete</Button>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4 pt-2">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Power Tools" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl><Input placeholder="Short description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
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
