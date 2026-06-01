'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getSupplierList, createSupplier, deleteSupplier } from '@/actions/suppliers.actions'
import { supplierSchema, type SupplierInput } from '@/lib/validations/supplier.schema'
import { formatCurrency } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import PaginationBar from '@/components/ui/pagination-bar'

export default function SuppliersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers-list', page],
    queryFn: async () => {
      const result = await getSupplierList({ page })
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const suppliers = data?.suppliers ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 20)

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', contact_person: '', phone: '', email: '', address: '' },
  })

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success('Supplier added.')
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setDialogOpen(false)
      form.reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSupplier(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); setDeleteTarget(null); return }
      toast.success(`${deleteTarget?.name} deleted.`)
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setDeleteTarget(null)
    },
  })

  const canDelete = user?.role === 'ADMIN'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="text-sm text-gray-500">{total} suppliers</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Supplier</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Contact Person</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Credit Balance</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : suppliers.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No suppliers yet. Add your first supplier.
                    </td>
                  </tr>
                )
              : suppliers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/suppliers/${s.id}`)}>
                    <td className="px-4 py-3 font-medium text-blue-600">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.contact_person ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.email ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-medium ${s.credit_balance > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {formatCurrency(s.credit_balance)}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline"
                          onClick={() => router.push(`/suppliers/${s.id}`)}>
                          Edit
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive"
                            onClick={() => setDeleteTarget({ id: s.id, name: s.name })}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        itemLabel="suppliers"
      />

      {/* Add Supplier Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
              {(['name', 'contact_person', 'phone', 'email', 'address'] as const).map((fieldName) => (
                <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{fieldName.replace('_', ' ')}{fieldName === 'name' ? ' *' : ''}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving…' : 'Add Supplier'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Supplier</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 pt-2">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            <br />
            <span className="text-xs text-gray-400 mt-1 block">Blocked if this supplier has any purchase history.</span>
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
