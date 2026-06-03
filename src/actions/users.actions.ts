'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types/database.types'
import { writeAuditLog } from './audit.actions'

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  // Block changing own role if this user is the only active ADMIN
  if (id === user.id && role !== 'ADMIN') {
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .eq('is_active', true)
    if ((admins ?? []).length <= 1) {
      return { data: null, error: 'Cannot change your role — you are the only active ADMIN.' }
    }
  }

  const { error } = await supabase.from('users').update({ role }).eq('id', id)
  if (error) return { data: null, error: error.message }

  const { data: target } = await supabase.from('users').select('full_name').eq('id', id).single()
  await writeAuditLog(supabase, {
    action: 'UPDATE', entity: 'user', entity_id: id,
    description: `Changed role of "${target?.full_name ?? id}" to ${role}`,
  })
  return { data: true, error: null }
}

export async function toggleUserStatus(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  if (id === user.id) {
    return { data: null, error: 'You cannot deactivate your own account.' }
  }

  const { data: target } = await supabase
    .from('users')
    .select('is_active, role')
    .eq('id', id)
    .single()
  if (!target) return { data: null, error: 'User not found.' }

  // Block deactivating the only active ADMIN
  if (target.is_active && target.role === 'ADMIN') {
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'ADMIN')
      .eq('is_active', true)
    if ((admins ?? []).length <= 1) {
      return { data: null, error: 'Cannot deactivate the only active ADMIN.' }
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ is_active: !target.is_active })
    .eq('id', id)
  if (error) return { data: null, error: error.message }

  const { data: named } = await supabase.from('users').select('full_name').eq('id', id).single()
  const verb = target.is_active ? 'Deactivated' : 'Activated'
  await writeAuditLog(supabase, {
    action: 'UPDATE', entity: 'user', entity_id: id,
    description: `${verb} user "${named?.full_name ?? id}"`,
  })
  return { data: !target.is_active, error: null }
}

export async function updateUserProfile(fields: {
  full_name?: string
  birthday?: string | null
  address?: string | null
  id_number?: string | null
  mobile?: string | null
  avatar_url?: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const { error } = await supabase.from('users').update(fields).eq('id', user.id)
  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

export async function inviteUser(fullName: string, email: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!caller || caller.role !== 'ADMIN') {
    return { data: null, error: 'Only ADMINs can invite users.' }
  }

  // Build a temp password: random alphanumeric + guaranteed uppercase + digit + special char
  const rand = Math.random().toString(36).slice(2, 10)
  const tempPassword = rand.charAt(0).toUpperCase() + rand.slice(1) + '7!'

  const admin = adminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })
  if (authError) return { data: null, error: authError.message }

  const { error: insertError } = await supabase
    .from('users')
    .insert({ id: authData.user.id, full_name: fullName, email, role, is_active: true })
  if (insertError) {
    // Rollback the auth user so we don't leave orphaned auth accounts
    await admin.auth.admin.deleteUser(authData.user.id)
    return { data: null, error: insertError.message }
  }

  await writeAuditLog(supabase, {
    action: 'CREATE', entity: 'user', entity_id: authData.user.id,
    description: `Created user "${fullName}" (${email}) with role ${role}`,
  })
  return { data: { tempPassword }, error: null }
}
