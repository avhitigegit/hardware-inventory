'use server'

import { createClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string }

const PAGE_SIZE = 50

// ── Write helper ─────────────────────────────────────────────────────────────
// Called from inside other server actions. Never throws — audit must not break
// the main operation.
export async function writeAuditLog(
  supabase: any,
  entry: {
    action: 'CREATE' | 'UPDATE' | 'DELETE'
    entity: string
    entity_id?: string
    description: string
  }
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    let userName: string | null = null
    if (user?.id) {
      const { data: u } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()
      userName = u?.full_name ?? null
    }
    await supabase.from('audit_logs').insert({
      user_id:     user?.id   ?? null,
      user_name:   userName,
      action:      entry.action,
      entity:      entry.entity,
      entity_id:   entry.entity_id ?? null,
      description: entry.description,
    })
  } catch {
    // Intentionally silent — audit failure must never block the main operation
  }
}

// ── Read (ADMIN / OWNER only, enforced by RLS) ────────────────────────────────
export async function getAuditLogs(filters?: {
  entity?:    string
  action?:    string
  userId?:    string
  startDate?: string
  endDate?:   string
  page?:      number
}): Promise<ActionResult<{ logs: any[]; total: number }>> {
  const supabase = await createClient()
  const page = filters?.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  if (filters?.entity)    query = query.eq('entity', filters.entity)
  if (filters?.action)    query = query.eq('action', filters.action)
  if (filters?.userId)    query = query.eq('user_id', filters.userId)
  if (filters?.startDate) query = query.gte('created_at', filters.startDate)
  if (filters?.endDate)   query = query.lte('created_at', filters.endDate + 'T23:59:59')

  const { data, error, count } = await query
  if (error) return { data: null, error: error.message }
  return { data: { logs: data ?? [], total: count ?? 0 }, error: null }
}

export async function getAuditUsers(): Promise<ActionResult<{ id: string; full_name: string }[]>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('user_id, user_name')
    .not('user_id', 'is', null)
  if (error) return { data: null, error: error.message }

  // Deduplicate by user_id
  const seen = new Set<string>()
  const users: { id: string; full_name: string }[] = []
  for (const row of data ?? []) {
    if (row.user_id && !seen.has(row.user_id)) {
      seen.add(row.user_id)
      users.push({ id: row.user_id, full_name: row.user_name ?? row.user_id })
    }
  }
  return { data: users, error: null }
}
