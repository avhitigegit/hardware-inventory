'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getCustomerById, getCustomerSales, getCustomerPayments,
  updateCustomer, recordCustomerPayment,
} from '@/actions/customers.actions'
import { customerSchema, customerPaymentSchema, type CustomerInput, type CustomerPaymentInput } from '@/lib/validations/customer.schema'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useUser } from '@/hooks/useUser'

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const id = Number(params.id)

  const [activeTab, setActiveTab] = useState<'sales' | 'payments'>('sales')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const result = await getCustomerById(id)
      if (result.error) throw new Error(result.error)
      return result.data
    },
  })

  const { data: sales = [] } = useQuery({
    queryKey: ['customer-sales', id],
    queryFn: async () => {
      const result = await getCustomerSales(id)
      return result.data ?? []
    },
    enabled: activeTab === 'sales',
  })

  const { data: payments = [] } = useQuery({
    queryKey: ['customer-payments', id],
    queryFn: async () => {
      const result = await getCustomerPayments(id)
      return result.data ?? []
    },
    enabled: activeTab === 'payments',
  })

  const infoForm = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    values: customer ? {
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      credit_limit: customer.credit_limit,
    } : undefined,
  })

  const paymentForm = useForm<CustomerPaymentInput>({
    resolver: zodResolver(customerPaymentSchema),
    defaultValues: { amount: 0, notes: '' },
  })

  const updateMutation = useMutation({
    mutationFn: (input: CustomerInput) => updateCustomer(id, input),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success('Customer updated.')
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: (input: CustomerPaymentInput) => recordCustomerPayment(id, input),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(`Payment of ${formatCurrency(paymentForm.getValues('amount'))} received from ${customer?.name}.`)
      queryClient.invalidateQueries({ queryKey: ['customer', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-payments', id] })
      setPaymentDialogOpen(false)
      paymentForm.reset()
    },
  })

  const canEdit = user?.role && ['ADMIN', 'OWNER', 'CASHIER'].includes(user.role)

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!customer) return <p className="text-red-500">Customer not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/customers')} className="text-sm text-blue-600 hover:underline mb-1 block">← Back to Customers</button>
          <h1 className="text-2xl font-bold text-gray-800">{customer.name}</h1>
        </div>
        {customer.credit_balance > 0 && canEdit && (
          <Button variant="outline" onClick={() => { paymentForm.reset({ amount: 0, notes: '' }); setPaymentDialogOpen(true) }}>
            Record Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Credit Balance</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${customer.credit_balance > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
              {formatCurrency(customer.credit_balance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Credit Limit</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-800">
              {customer.credit_limit > 0 ? formatCurrency(customer.credit_limit) : 'Unlimited'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
        <CardContent>
          <Form {...infoForm}>
            <form onSubmit={infoForm.handleSubmit((d) => updateMutation.mutate(d))} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['name', 'phone', 'email', 'address'] as const).map((fieldName) => (
                <FormField key={fieldName} control={infoForm.control} name={fieldName} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{fieldName}</FormLabel>
                    <FormControl><Input {...field} disabled={!canEdit} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <FormField control={infoForm.control} name="credit_limit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit (Rs.) <span className="text-gray-400 text-xs">(0 = unlimited)</span></FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" disabled={!canEdit}
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
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

      <div>
        <div className="flex border-b mb-4">
          {(['sales', 'payments'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'sales' ? 'Sales History' : 'Payment History'}
            </button>
          ))}
        </div>

        {activeTab === 'sales' && (
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Payment</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sales.length === 0
                  ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No sales history.</td></tr>
                  : sales.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/sales/${s.id}`)}>
                        <td className="px-4 py-3">{formatDateTime(s.created_at)}</td>
                        <td className="px-4 py-3 text-right">{s.items_count}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total_amount)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={s.payment_type === 'CREDIT' ? 'secondary' : 'outline'}>{s.payment_type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{s.cashier_name}</td>
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

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Payment — {customer.name}</DialogTitle></DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit((d) => paymentMutation.mutate(d))} className="space-y-4 pt-2">
              <p className="text-sm text-gray-500">Credit balance: <strong className="text-amber-600">{formatCurrency(customer.credit_balance)}</strong></p>
              <FormField control={paymentForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (Rs.)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" max={customer.credit_balance}
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={paymentForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. Cash payment" {...field} /></FormControl>
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
    </div>
  )
}
