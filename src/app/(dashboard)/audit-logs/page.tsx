'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { getAuditLogs, getAuditUsers } from '@/actions/audit.actions'
import { formatDateTime } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import PaginationBar from '@/components/ui/pagination-bar'

const ENTITIES = ['product', 'sale', 'purchase', 'return', 'stock_adjustment', 'user', 'customer', 'supplier']
const ACTIONS  = ['CREATE', 'UPDATE', 'DELETE']

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100  text-blue-700',
  DELETE: 'bg-red-100   text-red-700',
}

const entityLabel: Record<string, string> = {
  product:          'Product',
  sale:             'Sale',
  purchase:         'Purchase / GRN',
  return:           'Return',
  stock_adjustment: 'Stock Adjustment',
  user:             'User',
  customer:         'Customer',
  supplier:         'Supplier',
}

export default function AuditLogsPage() {
  const { user } = useUser()
  const router   = useRouter()

  const [page,      setPage]      = useState(1)
  const [entity,    setEntity]    = useState('')
  const [action,    setAction]    = useState('')
  const [userId,    setUserId]    = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  useEffect(() => {
    if (user && !['ADMIN', 'OWNER'].includes(user.role)) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, entity, action, userId, startDate, endDate],
    queryFn: async () => {
      const r = await getAuditLogs({
        entity:    entity    || undefined,
        action:    action    || undefined,
        userId:    userId    || undefined,
        startDate: startDate || undefined,
        endDate:   endDate   || undefined,
        page,
      })
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  const { data: auditUsers = [] } = useQuery({
    queryKey: ['audit-users'],
    queryFn: async () => {
      const r = await getAuditUsers()
      return r.data ?? []
    },
  })

  const logs       = data?.logs  ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / 50)
  const hasFilters = entity || action || userId || startDate || endDate

  const resetFilters = () => {
    setEntity(''); setAction(''); setUserId('')
    setStartDate(''); setEndDate(''); setPage(1)
  }

  if (user && !['ADMIN', 'OWNER'].includes(user.role)) return null

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Audit Log</h1>
        <p className="text-sm text-gray-500">{total} events recorded</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">From Date</label>
          <Input type="date" value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1) }}
            className="w-36 text-sm h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">To Date</label>
          <Input type="date" value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1) }}
            className="w-36 text-sm h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Module</label>
          <select className="rounded-md border px-3 py-2 text-sm bg-white h-9 min-w-[150px]"
            value={entity} onChange={e => { setEntity(e.target.value); setPage(1) }}>
            <option value="">All Modules</option>
            {ENTITIES.map(e => <option key={e} value={e}>{entityLabel[e]}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</label>
          <select className="rounded-md border px-3 py-2 text-sm bg-white h-9 min-w-[120px]"
            value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">User</label>
          <select className="rounded-md border px-3 py-2 text-sm bg-white h-9 min-w-[150px]"
            value={userId} onChange={e => { setUserId(e.target.value); setPage(1) }}>
            <option value="">All Users</option>
            {auditUsers.map((u: any) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" className="h-9 self-end" onClick={resetFilters}>
            ✕ Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-40">Date / Time</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-32">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-24">Action</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-36">Module</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : logs.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-gray-400">
                      {hasFilters ? 'No events match the selected filters.' : 'No audit events recorded yet.'}
                    </td>
                  </tr>
                )
              : logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 text-xs">
                      {log.user_name ?? <span className="text-gray-400">System</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        actionColors[log.action] ?? 'bg-gray-100 text-gray-600'
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {entityLabel[log.entity] ?? log.entity}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.description}
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemLabel="events" />
    </div>
  )
}
