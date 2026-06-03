'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import type { UserRole, UserStatus } from '@/types/database.types'
import { writeAuditLog } from './audit.actions'

function adminClient() {
  return createSupabaseAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PENDING and ACTIVE can log in; everything else is blocked
function isActiveStatus(status: UserStatus) {
  return status === 'ACTIVE' || status === 'PENDING'
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getUsers() {
  const admin = adminClient()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getUserById(id: string) {
  const admin = adminClient()
  const { data, error } = await admin
    .from('users')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Role ──────────────────────────────────────────────────────────────────────

export async function updateUserRole(id: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  if (id === user.id && role !== 'ADMIN') {
    const { data: admins } = await supabase
      .from('users').select('id').eq('role', 'ADMIN').eq('is_active', true)
    if ((admins ?? []).length <= 1)
      return { data: null, error: 'Cannot change your role — you are the only active ADMIN.' }
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

// ── Status ────────────────────────────────────────────────────────────────────

export async function updateUserStatus(id: string, status: UserStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  if (id === user.id)
    return { data: null, error: 'You cannot change your own status.' }

  if (!isActiveStatus(status)) {
    const { data: target } = await supabase
      .from('users').select('role, full_name').eq('id', id).single()
    if (target?.role === 'ADMIN') {
      const { data: admins } = await supabase
        .from('users').select('id').eq('role', 'ADMIN').eq('is_active', true)
      if ((admins ?? []).length <= 1)
        return { data: null, error: 'Cannot change status of the only active ADMIN.' }
    }
  }

  const is_active = isActiveStatus(status)
  const { error } = await supabase
    .from('users').update({ status, is_active }).eq('id', id)
  if (error) return { data: null, error: error.message }

  const { data: named } = await supabase.from('users').select('full_name').eq('id', id).single()
  await writeAuditLog(supabase, {
    action: 'UPDATE', entity: 'user', entity_id: id,
    description: `Changed status of "${named?.full_name ?? id}" to ${status}`,
  })
  return { data: true, error: null }
}

// Called from TopNav after first password change — moves user from PENDING → ACTIVE
export async function activateFromPending() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const admin = adminClient()

  const { data: current } = await admin
    .from('users').select('status, full_name').eq('id', user.id).single()

  if (!current || current.status !== 'PENDING') return { data: null, error: null }

  const { error } = await admin
    .from('users').update({ status: 'ACTIVE', is_active: true }).eq('id', user.id)
  if (error) {
    console.error('[activateFromPending] update failed:', error.message)
    return { data: null, error: error.message }
  }

  await writeAuditLog(supabase, {
    action: 'UPDATE', entity: 'user', entity_id: user.id,
    description: `"${current.full_name}" activated — changed password on first login`,
  })
  return { data: true, error: null }
}

// ── Profile (self) ────────────────────────────────────────────────────────────

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
  const { error } = await adminClient().from('users').update(fields).eq('id', user.id)
  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

export async function changePassword(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { data: null, error: error.message }
  return { data: true, error: null }
}

// ── Invite ────────────────────────────────────────────────────────────────────

export async function inviteUser(fullName: string, email: string, role: UserRole) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Unauthorized' }

  const { data: caller } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!caller || caller.role !== 'ADMIN')
    return { data: null, error: 'Only ADMINs can invite users.' }

  const rand = Math.random().toString(36).slice(2, 10)
  const tempPassword = rand.charAt(0).toUpperCase() + rand.slice(1) + '7!'

  const admin = adminClient()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password: tempPassword, email_confirm: true,
  })
  if (authError) return { data: null, error: authError.message }

  // Status starts as PENDING — becomes ACTIVE after first password change
  const { error: insertError } = await supabase
    .from('users')
    .insert({ id: authData.user.id, full_name: fullName, email, role, is_active: true, status: 'PENDING' })
  if (insertError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return { data: null, error: insertError.message }
  }

  // Send welcome email — returns error string if it failed
  const emailError = await sendWelcomeEmail({ fullName, email, role, tempPassword })

  await writeAuditLog(supabase, {
    action: 'CREATE', entity: 'user', entity_id: authData.user.id,
    description: `Created user "${fullName}" (${email}) with role ${role} — status PENDING`,
  })

  return { data: { emailSent: !emailError, emailError }, error: null }
}

// ── Email ─────────────────────────────────────────────────────────────────────

async function sendWelcomeEmail({
  fullName, email, role, tempPassword,
}: { fullName: string; email: string; role: string; tempPassword: string }): Promise<string | null> {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    return 'GMAIL_USER or GMAIL_APP_PASSWORD not configured in .env.local'
  }

  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Shop'
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL   ?? 'http://localhost:3000'

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrator', OWNER: 'Owner',
    CASHIER: 'Cashier', STORE_KEEPER: 'Store Keeper',
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.sendMail({
      from: `"${shopName}" <${gmailUser}>`,
      to: email,
      subject: `Welcome to ${shopName} — Your login details`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:560px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#111827;padding:30px 40px;">
    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${shopName}</h1>
    <p style="margin:5px 0 0;color:#9ca3af;font-size:13px;">Inventory Management System</p>
  </td></tr>

  <!-- Greeting -->
  <tr><td style="padding:36px 40px 0;">
    <h2 style="margin:0 0 12px;font-size:18px;color:#111827;">Welcome, ${fullName}!</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      Your account has been created on the <strong>${shopName}</strong> inventory system.
      Below are your login credentials. Please log in and change your password immediately.
    </p>
  </td></tr>

  <!-- Credentials box -->
  <tr><td style="padding:0 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;">
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">Your Login Details</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#6b7280;width:130px;">Login URL</td>
            <td style="padding:7px 0;">
              <a href="${appUrl}/login" style="font-size:13px;color:#2563eb;font-weight:600;">${appUrl}/login</a>
            </td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#6b7280;">Email</td>
            <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:600;">${email}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#6b7280;">Temp Password</td>
            <td style="padding:7px 0;">
              <span style="font-size:18px;color:#111827;font-weight:700;font-family:monospace;letter-spacing:3px;background:#e5e7eb;padding:4px 10px;border-radius:4px;">${tempPassword}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;color:#6b7280;">Your Role</td>
            <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:600;">${roleLabel[role] ?? role}</td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- Steps -->
  <tr><td style="padding:28px 40px 0;">
    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#111827;">Steps to get started:</p>
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:5px 12px 5px 0;font-size:22px;color:#10b981;vertical-align:top;">①</td>
        <td style="padding:5px 0;font-size:13px;color:#374151;line-height:1.6;">
          Click <strong>Log In Now</strong> below and enter your email and the temporary password above.
        </td>
      </tr>
      <tr>
        <td style="padding:5px 12px 5px 0;font-size:22px;color:#10b981;vertical-align:top;">②</td>
        <td style="padding:5px 0;font-size:13px;color:#374151;line-height:1.6;">
          Click your <strong>avatar (top right)</strong> → <strong>Change Password</strong> to set a new secure password.
        </td>
      </tr>
      <tr>
        <td style="padding:5px 12px 5px 0;font-size:22px;color:#10b981;vertical-align:top;">③</td>
        <td style="padding:5px 0;font-size:13px;color:#374151;line-height:1.6;">
          Your account will be activated automatically once you change your password.
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Warning -->
  <tr><td style="padding:24px 40px;">
    <table width="100%" cellpadding="0" cellspacing="0"
      style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;">
      <tr><td style="padding:14px 18px;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
          ⚠ <strong>Important:</strong> This is a temporary password. Please change it immediately after your first login.
          Do not share this email with anyone.
        </p>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td style="padding:0 40px 36px;" align="center">
    <a href="${appUrl}/login"
      style="display:inline-block;background:#111827;color:#ffffff;font-size:15px;font-weight:700;padding:14px 40px;border-radius:8px;text-decoration:none;">
      Log In Now →
    </a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px 40px;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
      This is an automated email from ${shopName}. Do not reply to this email.<br>
      If you did not expect this account, please contact your administrator.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    })
    return null
  } catch (err: any) {
    return err?.message ?? 'Unknown email error'
  }
}
