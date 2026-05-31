'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { getUsers, updateUserRole, toggleUserStatus, inviteUser } from '@/actions/users.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { UserRole } from '@/types/database.types'

const ROLES: UserRole[] = ['ADMIN', 'OWNER', 'CASHIER', 'STORE_KEEPER']

const roleBadgeColor: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  OWNER: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-green-100 text-green-700',
  STORE_KEEPER: 'bg-yellow-100 text-yellow-700',
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
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [currentUser, router])

  const [savingRole, setSavingRole] = useState<Record<string, boolean>>({})
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({})

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('CASHIER')
  const [inviteError, setInviteError] = useState('')

  // Success dialog after invite
  const [successOpen, setSuccessOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [invitedName, setInvitedName] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const r = await getUsers()
      if (r.error) throw new Error(r.error)
      return r.data ?? []
    },
  })

  const handleRoleChange = async (id: string, role: UserRole) => {
    setSavingRole(prev => ({ ...prev, [id]: true }))
    const result = await updateUserRole(id, role)
    setSavingRole(prev => ({ ...prev, [id]: false }))
    if (result.error) {
      toast.error(result.error)
      queryClient.invalidateQueries({ queryKey: ['users'] }) // revert optimistic display
    } else {
      toast.success('Role updated.')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean, name: string) => {
    setSavingStatus(prev => ({ ...prev, [id]: true }))
    const result = await toggleUserStatus(id)
    setSavingStatus(prev => ({ ...prev, [id]: false }))
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${name} has been ${isActive ? 'deactivated' : 'activated'}.`)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    }
  }

  const handleInvite = async () => {
    if (!inviteName.trim()) { setInviteError('Full name is required.'); return }
    if (!inviteEmail.trim()) { setInviteError('Email is required.'); return }
    setInviteError('')
    setInviteLoading(true)
    const result = await inviteUser(inviteName.trim(), inviteEmail.trim(), inviteRole)
    setInviteLoading(false)
    if (result.error) {
      setInviteError(result.error)
      return
    }
    setInvitedName(inviteName.trim())
    setTempPassword(result.data!.tempPassword)
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('CASHIER')
    setSuccessOpen(true)
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const openInvite = () => {
    setInviteName('')
    setInviteEmail('')
    setInviteRole('CASHIER')
    setInviteError('')
    setInviteOpen(true)
  }

  // Don't render anything until role is confirmed
  if (currentUser && currentUser.role !== 'ADMIN') return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-sm text-gray-500">Manage staff accounts and access roles</p>
        </div>
        <Button onClick={openInvite}>+ Invite User</Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Full Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map((u: any) => {
                const isSelf = u.id === currentUser?.id
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {u.full_name}
                      {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className={`rounded px-2 py-1 text-xs font-semibold border-0 outline-none cursor-pointer ${roleBadgeColor[u.role as UserRole]} disabled:opacity-60 disabled:cursor-wait`}
                        value={u.role}
                        disabled={!!savingRole[u.id]}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active, u.full_name)}
                        disabled={!!savingStatus[u.id] || isSelf}
                        title={isSelf ? 'You cannot deactivate yourself' : undefined}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity ${
                          u.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {savingStatus[u.id] ? '…' : u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {inviteError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{inviteError}</div>
            )}
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Kasun Perera"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="staff@shop.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm bg-white"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as UserRole)}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading}>
              {inviteLoading ? 'Creating…' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Temp Password Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Account Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              <strong>{invitedName}</strong>&apos;s account has been created successfully.
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Share this temporary password with them. They can change it after signing in via <strong>Change Password</strong>.
              </p>
              <div
                className="rounded-md bg-gray-100 px-4 py-3 font-mono text-base text-center font-bold tracking-widest select-all cursor-text"
                title="Click to select"
              >
                {tempPassword}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">Click to select all, then copy.</p>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button className="w-full" onClick={() => setSuccessOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
