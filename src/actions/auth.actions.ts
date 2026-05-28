'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'Invalid email or password' }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (!userData) {
    await supabase.auth.signOut()
    return { error: 'Invalid email or password' }
  }

  if (!userData.is_active) {
    await supabase.auth.signOut()
    return { error: 'Your account has been deactivated. Contact the administrator.' }
  }

  const role = userData.role
  if (role === 'CASHIER') redirect('/sales/pos')
  if (role === 'STORE_KEEPER') redirect('/purchases')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return userData
}
