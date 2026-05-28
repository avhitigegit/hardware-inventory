'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getCustomers } from '@/actions/customers.actions'
import { createCustomer } from '@/actions/customers.actions'
import { customerSchema, type CustomerInput } from '@/lib/validations/customer.schema'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/hooks/useUser'

export default function CustomersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useUser()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creditOnly, setCreditOnly] = useState(false)

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const result = await getCustomers()
      if (result.error) throw new Error(result.error)
      return result.data ?? []
    },
  })

  const displayed = creditOnly ? customers.filter((c: any) => c.credit_balance > 0) : customers

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', credit_limit: 0 },
  })

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success('Customer added.')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDialogOpen(false)
      form.reset()
    },
  })

  const canWrite = user?.role && ['ADMIN', 'OWNER', 'CASHIER'].includes(user.role)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} customers</p>
        </div>
        {canWrite && <Button onClick={() => setDialogOpen(true)}>Add Customer</Button>}
      </div>

      <div className="flex gap-3">
        <Button
          variant={creditOnly ? 'default' : 'outline'}
          onClick={() => setCreditOnly(!creditOnly)}
        >
          {creditOnly ? 'Credit Customers ✓' : 'Credit Customers Only'}
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Credit Limit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Credit Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : displayed.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      {creditOnly ? 'No customers with outstanding credit.' : 'No customers yet.'}
                    </td>
                  </tr>
                )
              : displayed.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/customers/${c.id}`)}>
                    <td className="px-4 py-3 font-medium text-blue-600">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {c.credit_limit > 0 ? formatCurrency(c.credit_limit) : 'Unlimited'}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${c.credit_balance > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {formatCurrency(c.credit_balance)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
              {(['name', 'phone', 'email', 'address'] as const).map((fieldName) => (
                <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{fieldName}{fieldName === 'name' ? ' *' : ''}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
              <FormField control={form.control} name="credit_limit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit (Rs.) <span className="text-gray-400 text-xs">(0 = unlimited)</span></FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0"
                      {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving…' : 'Add Customer'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
