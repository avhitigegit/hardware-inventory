'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { getUsers, inviteUser, updateUserStatus } from '@/actions/users.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types/database.types'

const ROLES: UserRole[] = ['ADMIN', 'OWNER', 'CASHIER', 'STORE_KEEPER']

const roleColors: Record<UserRole, string> = {
  ADMIN:        'bg-red-100 text-red-700',
  OWNER:        'bg-blue-100 text-blue-700',
  CASHIER:      'bg-green-100 text-green-700',
  STORE_KEEPER: 'bg-yellow-100 text-yellow-700',
}

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator', OWNER: 'Owner',
  CASHIER: 'Cashier', STORE_KEEPER: 'Store Keeper',
}

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'PENDING',    label: 'Pending',    color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ACTIVE',     label: 'Active',     color: 'bg-green-100 text-green-700' },
  { value: 'INACTIVE',   label: 'Inactive',   color: 'bg-gray-100 text-gray-500' },
  { value: 'RESIGNED',   label: 'Resigned',   color: 'bg-amber-100 text-amber-700' },
  { value: 'TERMINATED', label: 'Terminated', color: 'bg-red-100 text-red-700' },
  { value: 'BLOCKED',    label: 'Blocked',    color: 'bg-purple-100 text-purple-700' },
]

function statusStyle(s: string) {
  return STATUS_OPTIONS.find(o => o.value === s)?.color ?? 'bg-gray-100 text-gray-500'
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso))
}

export default function UsersPage() {
  const { user: currentUser } = useUser()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') router.replace('/dashboard')
  }, [currentUser, router])

  // Invite dialog
  const [inviteOpen,   setInviteOpen]   = useState(false)
  const [inviteLoading,setInviteLoading]= useState(false)
  const [inviteName,   setInviteName]   = useState('')
  const [inviteEmail,  setInviteEmail]  = useState('')
  const [inviteRole,   setInviteRole]   = useState<UserRole>('CASHIER')
  const [inviteError,  setInviteError]  = useState('')

  // Success dialog
  const [successOpen,  setSuccessOpen]  = useState(false)
  const [invitedName,  setInvitedName]  = useState('')
  const [invitedEmail, setInvitedEmail] = useState('')
  const [emailSent,    setEmailSent]    = useState(false)
  const [emailErrMsg,  setEmailErrMsg]  = useState<string | null>(null)

  // Status change dialog
  const [statusTarget, setStatusTarget] = useState<any>(null)
  const [newStatus,    setNewStatus]    = useState<UserStatus>('ACTIVE')
  const [savingStatus, setSavingStatus] = useState(false)

  const { data: users = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await getUsers()
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
    refetchInterval: 10000, // refresh every 10 seconds to pick up status changes
    staleTime: 0,
  })

  const openInvite = () => {
    setInviteName(''); setInviteEmail(''); setInviteRole('CASHIER'); setInviteError('')
    setInviteOpen(true)
  }

  const handleInvite = async () => {
    if (!inviteName.trim()) { setInviteError('Full name is required.'); return }
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return }
    setInviteError(''); setInviteLoading(true)
    const result = await inviteUser(inviteName.trim(), inviteEmail.trim(), inviteRole)
    setInviteLoading(false)
    if (result.error) { setInviteError(result.error); return }
    setInvitedName(inviteName.trim())
    setInvitedEmail(inviteEmail.trim())
    setEmailSent(!result.data?.emailError)
    setEmailErrMsg(result.data?.emailError ?? null)
    setInviteOpen(false)
    setInviteName(''); setInviteEmail(''); setInviteRole('CASHIER')
    setSuccessOpen(true)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const openStatusChange = (u: any) => {
    setStatusTarget(u)
    setNewStatus(u.status ?? 'ACTIVE')
  }

  const handleStatusChange = async () => {
    if (!statusTarget) return
    setSavingStatus(true)
    const result = await updateUserStatus(statusTarget.id, newStatus)
    setSavingStatus(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`${statusTarget.full_name} marked as ${newStatus}.`)
    setStatusTarget(null)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  if (currentUser && currentUser.role !== 'ADMIN') return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Manage staff accounts, roles and status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 border rounded-md px-3 py-2 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh user list"
          >
            <svg className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <Button onClick={openInvite}>+ Invite User</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Full Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              : users.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">No users found.</td>
                  </tr>
                )
              : users.map((u: any) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {u.full_name}
                        {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          roleColors[u.role as UserRole]
                        )}>
                          {roleLabels[u.role as UserRole] ?? u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          statusStyle(u.status ?? 'ACTIVE')
                        )}>
                          {u.status ?? 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" variant="outline"
                            onClick={() => router.push(`/users/${u.id}`)}>
                            View
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => router.push(`/users/${u.id}`)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSelf}
                            title={isSelf ? 'You cannot change your own status' : 'Change status'}
                            onClick={() => openStatusChange(u)}
                            className={cn(
                              !isSelf && (u.status ?? 'ACTIVE') !== 'ACTIVE'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : ''
                            )}
                          >
                            Status
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── Invite User Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite New User</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {inviteError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
            )}
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input placeholder="e.g. Kasun Perera" value={inviteName}
                onChange={e => setInviteName(e.target.value)} autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input type="email" placeholder="staff@shop.com" value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}>
                {ROLES.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400">
              A welcome email with login credentials will be sent automatically.
            </p>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Account Created</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              <strong>{invitedName}</strong>&apos;s account has been created. Status is <strong>Pending</strong> until they log in and change their password.
            </div>

            {emailSent ? (
              <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>
                  Welcome email with login credentials sent to <strong>{invitedEmail}</strong>.
                  They should receive it shortly.
                </span>
              </div>
            ) : (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 space-y-1">
                <p className="font-semibold">⚠ Email could not be sent</p>
                <p className="text-xs">{emailErrMsg ?? 'Resend not configured.'}</p>
                <p className="text-xs">
                  Please share the login details with <strong>{invitedName}</strong> manually.
                  Check that <code>RESEND_API_KEY</code> is set correctly in <code>.env.local</code>.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button className="w-full" onClick={() => setSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Change Status Dialog ── */}
      <Dialog open={!!statusTarget} onOpenChange={(o) => { if (!o) setStatusTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Status — {statusTarget?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-3">
            <p className="text-sm text-gray-500">
              Select a new status. Any status other than <strong>Active</strong> will block the user from logging in immediately.
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNewStatus(opt.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all',
                    newStatus === opt.value
                      ? opt.color + ' border-current shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setStatusTarget(null)}>Cancel</Button>
            <Button
              onClick={handleStatusChange}
              disabled={savingStatus || newStatus === (statusTarget?.status ?? 'ACTIVE')}
              variant={newStatus !== 'ACTIVE' ? 'destructive' : 'default'}
            >
              {savingStatus ? 'Saving…' : `Set ${newStatus}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
