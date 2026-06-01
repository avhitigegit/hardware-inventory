'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getSupplierById, getSupplierPurchases, getSupplierPayments,
  updateSupplier, deleteSupplier, recordSupplierPayment,
} from '@/actions/suppliers.actions'
import { supplierSchema, supplierPaymentSchema, type SupplierInput, type SupplierPaymentInput } from '@/lib/validations/supplier.schema'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/useUser'

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const id = Number(params.id)

  const [activeTab, setActiveTab] = useState<'purchases' | 'payments'>('purchases')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const result = await getSupplierById(id)
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: purchases = [] } = useQuery({
    queryKey: ['supplier-purchases', id],
    queryFn: async () => {
      const result = await getSupplierPurchases(id)
      return result.data ?? []
    },
    enabled: activeTab === 'purchases',
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['supplier-payments', id],
    queryFn: async () => {
      const result = await getSupplierPayments(id)
      return result.data ?? []
    },
    enabled: activeTab === 'payments',
  })

  const infoForm = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', contact_person: '', phone: '', email: '', address: '',
    },
    values: supplier ? {
      name: supplier.name,
      contact_person: supplier.contact_person ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
    } : undefined,
  })

  const paymentForm = useForm<SupplierPaymentInput>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: { amount: 0, notes: '' },
  })

  const updateMutation = useMutation({
    mutationFn: (input: SupplierInput) => updateSupplier(id, input),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success('Supplier updated.')
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (input: SupplierPaymentInput) => recordSupplierPayment(id, input),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(`Payment of ${formatCurrency(paymentForm.getValues('amount'))} recorded for ${supplier?.name}.`)
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      queryClient.invalidateQueries({ queryKey: ['supplier-payments', id] })
      setPaymentDialogOpen(false)
      paymentForm.reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteSupplier(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); setDeleteDialogOpen(false); return }
      toast.success('Supplier deleted.')
      router.push('/suppliers')
    },
  })

  const canEdit = user?.role && ['ADMIN', 'OWNER'].includes(user.role)
  const canDelete = user?.role === 'ADMIN'

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!supplier) return <p className="text-red-500">Supplier not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/suppliers')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Suppliers</button>
          <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
        </div>
        <div className="flex gap-2">
          {supplier.credit_balance > 0 && canEdit && (
            <Button variant="outline" onClick={() => { paymentForm.reset({ amount: 0, notes: '' }); setPaymentDialogOpen(true) }}>
              Record Payment
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>Delete</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Credit Balance</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${supplier.credit_balance > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {formatCurrency(supplier.credit_balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Editable Info */}
      <Card>
        <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
        <CardContent>
          <Form {...infoForm}>
            <form onSubmit={infoForm.handleSubmit((d) => updateMutation.mutate(d))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['name', 'contact_person', 'phone', 'email', 'address'] as const).map((fieldName) => (
                <FormField key={fieldName} control={infoForm.control} name={fieldName} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{fieldName.replace('_', ' ')}</FormLabel>
                    <FormControl><Input {...field} disabled={!canEdit} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              {canEdit && (
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div>
        <div className="flex border-b mb-4">
          {(['purchases', 'payments'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'purchases' ? 'Purchase History' : 'Payment History'}
            </button>
          ))}
        </div>

        {activeTab === 'purchases' && (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Invoice #</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {purchases.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No purchase history.</td></tr>
                  : purchases.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                        <td className="px-4 py-3">{p.invoice_number ?? '—'}</td>
                        <td className="px-4 py-3 text-right">{p.items_count}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.total_amount)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{p.payment_type}</Badge>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.length === 0
                  ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No payments recorded.</td></tr>
                  : payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDateTime(p.created_at)}</td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-gray-500">{p.notes ?? '—'}</td>
                        <td className="px-4 py-3">{p.recorded_by}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment — {supplier.name}</DialogTitle></DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit((d) => paymentMutation.mutate(d))} className="space-y-4 pt-2">
              <p className="text-sm text-gray-500">Credit balance: <strong className="text-amber-600">{formatCurrency(supplier.credit_balance)}</strong></p>
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Rs.)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" max={supplier.credit_balance}
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={paymentForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Bank transfer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? 'Saving…' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Supplier</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 pt-2">Delete <strong>{supplier.name}</strong>? This cannot be undone.</p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
