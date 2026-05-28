import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
})

export type SupplierInput = z.infer<typeof supplierSchema>

export const supplierPaymentSchema = z.object({
  amount: z.number({ error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  notes: z.string().optional(),
})

export type SupplierPaymentInput = z.infer<typeof supplierPaymentSchema>
