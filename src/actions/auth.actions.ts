'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
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

  // Use service role client to bypass RLS — the session cookie is not yet
  // available to auth.uid() within the same Server Action execution context.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: userData, error: userError } = await admin
    .from('users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single()

  if (userError || !userData) {
    console.error('[signIn] users query failed:', userError?.message, userError?.code, '| key prefix:', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 12))
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
