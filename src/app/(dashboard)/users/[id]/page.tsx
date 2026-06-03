'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/hooks/useUser'
import { getUserById, updateUserRole, updateUserStatus } from '@/actions/users.actions'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
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

const avatarColors: Record<UserRole, string> = {
  ADMIN: 'bg-red-600', OWNER: 'bg-blue-600',
  CASHIER: 'bg-green-600', STORE_KEEPER: 'bg-yellow-500',
}

const STATUS_OPTIONS: { value: UserStatus; label: string; color: string }[] = [
  { value: 'PENDING',    label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'ACTIVE',     label: 'Active',     color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'INACTIVE',   label: 'Inactive',   color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'RESIGNED',   label: 'Resigned',   color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'TERMINATED', label: 'Terminated', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'BLOCKED',    label: 'Blocked',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user: currentUser } = useUser()
  const queryClient = useQueryClient()

  const [selectedRole,   setSelectedRole]   = useState<UserRole | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('')
  const [savingRole,     setSavingRole]     = useState(false)
  const [savingStatus,   setSavingStatus]   = useState(false)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') router.replace('/dashboard')
  }, [currentUser, router])

  const { data: u, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const r = await getUserById(id)
      if (r.error) throw new Error(r.error)
      return r.data
    },
    staleTime: 0,
    refetchInterval: 10000,
  })

  useEffect(() => {
    if (u) {
      setSelectedRole(u.role)
      setSelectedStatus(u.status ?? 'ACTIVE')
    }
  }, [u])

  const isSelf = currentUser?.id === id

  const handleSaveRole = async () => {
    if (!selectedRole) return
    setSavingRole(true)
    const result = await updateUserRole(id, selectedRole as UserRole)
    setSavingRole(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Role updated.')
    queryClient.invalidateQueries({ queryKey: ['user', id] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const handleSaveStatus = async () => {
    if (!selectedStatus) return
    setSavingStatus(true)
    const result = await updateUserStatus(id, selectedStatus as UserStatus)
    setSavingStatus(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Status updated.')
    queryClient.invalidateQueries({ queryKey: ['user', id] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  if (currentUser && currentUser.role !== 'ADMIN') return null

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  if (!u) return <p className="text-red-500">User not found.</p>

  const initials = u.full_name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U'
  const avatarBg = avatarColors[u.role as UserRole] ?? 'bg-gray-700'

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => router.push('/users')}
        className="text-sm text-blue-600 hover:underline block">
        ← Back to Users
      </button>

      {/* Profile header card */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden',
            !u.avatar_url && avatarBg
          )}>
            {u.avatar_url
              ? <img src={u.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              : initials
            }
          </div>
          {/* Info */}
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {u.full_name}
              {isSelf && <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                roleColors[u.role as UserRole]
              )}>
                {roleLabels[u.role as UserRole] ?? u.role}
              </span>
              <span className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                statusStyle(u.status ?? 'ACTIVE')
              )}>
                {u.status ?? 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-400 mb-1">Full Name</dt>
            <dd className="font-medium text-gray-800">{u.full_name}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-1">Email</dt>
            <dd className="font-medium text-gray-800">{u.email}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-1">Mobile</dt>
            <dd className="font-medium text-gray-800">{u.mobile ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-1">Date of Birth</dt>
            <dd className="font-medium text-gray-800">{u.birthday ? formatDate(u.birthday) : '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-1">ID Number (NIC)</dt>
            <dd className="font-medium text-gray-800">{u.id_number ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-400 mb-1">Joined</dt>
            <dd className="font-medium text-gray-800">{formatDate(u.created_at)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-400 mb-1">Address</dt>
            <dd className="font-medium text-gray-800">{u.address ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {/* Role management */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Role</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="rounded-md border px-3 py-2 text-sm bg-white min-w-[180px]"
            value={selectedRole}
            disabled={isSelf || savingRole}
            onChange={e => setSelectedRole(e.target.value as UserRole)}
          >
            {ROLES.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
          <Button
            size="sm"
            onClick={handleSaveRole}
            disabled={isSelf || savingRole || selectedRole === u.role}
          >
            {savingRole ? 'Saving…' : 'Save Role'}
          </Button>
          {isSelf && <p className="text-xs text-gray-400">You cannot change your own role.</p>}
        </div>
      </div>

      {/* Status management */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Employment Status</h2>
        <p className="text-xs text-gray-400 mb-4">
          Only ACTIVE users can log in. All other statuses block access immediately.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              disabled={isSelf || savingStatus}
              onClick={() => setSelectedStatus(opt.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all',
                selectedStatus === opt.value
                  ? opt.color + ' border-current shadow-sm scale-[1.02]'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleSaveStatus}
            disabled={isSelf || savingStatus || selectedStatus === (u.status ?? 'ACTIVE')}
            variant={selectedStatus !== 'ACTIVE' && selectedStatus !== (u.status ?? 'ACTIVE') ? 'destructive' : 'default'}
          >
            {savingStatus ? 'Saving…' : 'Save Status'}
          </Button>
          {isSelf && <p className="text-xs text-gray-400">You cannot change your own status.</p>}
        </div>
      </div>
    </div>
  )
}
