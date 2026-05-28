import { z } from 'zod'

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
  credit_limit: z.number({ error: 'Enter credit limit' }).min(0, 'Must be 0 or more'),
})

export type CustomerInput = z.infer<typeof customerSchema>

export const customerPaymentSchema = z.object({
  amount: z.number({ error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  notes: z.string().optional(),
})

export type CustomerPaymentInput = z.infer<typeof customerPaymentSchema>
