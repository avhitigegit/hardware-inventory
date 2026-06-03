'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { signOut } from '@/actions/auth.actions'
import { updateUserProfile } from '@/actions/users.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database.types'

const roleColors: Record<UserRole, string> = {
  ADMIN:        'bg-red-100 text-red-700 border-red-200',
  OWNER:        'bg-blue-100 text-blue-700 border-blue-200',
  CASHIER:      'bg-green-100 text-green-700 border-green-200',
  STORE_KEEPER: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const avatarColors: Record<UserRole, string> = {
  ADMIN:        'bg-red-600',
  OWNER:        'bg-blue-600',
  CASHIER:      'bg-green-600',
  STORE_KEEPER: 'bg-yellow-500',
}

const roleLabels: Record<UserRole, string> = {
  ADMIN:        'Administrator',
  OWNER:        'Owner',
  CASHIER:      'Cashier',
  STORE_KEEPER: 'Store Keeper',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function TopNav({ title }: { title?: string }) {
  const { user } = useUser()
  const router = useRouter()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [pwOpen, setPwOpen]           = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [pwLoading, setPwLoading]     = useState(false)
  const [pwError, setPwError]         = useState('')

  // Profile form state
  const [profileLoading, setProfileLoading]     = useState(false)
  const [profileName, setProfileName]           = useState('')
  const [profileBirthday, setProfileBirthday]   = useState('')
  const [profileAddress, setProfileAddress]     = useState('')
  const [profileIdNumber, setProfileIdNumber]   = useState('')
  const [profileMobile, setProfileMobile]       = useState('')
  const [avatarFile, setAvatarFile]             = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview]       = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const openProfile = () => {
    setProfileName(user?.full_name ?? '')
    setProfileBirthday(user?.birthday ?? '')
    setProfileAddress(user?.address ?? '')
    setProfileIdNumber(user?.id_number ?? '')
    setProfileMobile(user?.mobile ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setMenuOpen(false)
    setProfileOpen(true)
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null
    const supabase = createClient()
    const ext = avatarFile.name.split('.').pop()
    const filename = `${user?.id ?? 'user'}.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filename, avatarFile, { upsert: true })
    if (error) {
      toast.warning(`Photo upload failed: ${error.message}`)
      return null
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filename)
    // Bust cache so the browser fetches the new image
    return `${data.publicUrl}?t=${Date.now()}`
  }

  const handleSaveProfile = async () => {
    if (!profileName.trim()) { toast.error('Full name is required.'); return }
    setProfileLoading(true)
    const newAvatarUrl = await uploadAvatar()
    const result = await updateUserProfile({
      full_name:  profileName.trim(),
      birthday:   profileBirthday || null,
      address:    profileAddress.trim() || null,
      id_number:  profileIdNumber.trim() || null,
      mobile:     profileMobile.trim() || null,
      ...(newAvatarUrl !== null ? { avatar_url: newAvatarUrl } : {}),
    })
    setProfileLoading(false)
    if (result.error) { toast.error(result.error); return }
    toast.success('Profile saved.')
    setProfileOpen(false)
    router.refresh()
  }

  const handleChangePassword = async () => {
    setPwError('')
    if (newPw.length < 8)    { setPwError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { setPwError(error.message); return }
    toast.success('Password changed successfully.')
    setPwOpen(false)
    setNewPw('')
    setConfirmPw('')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  const avatarBg   = user?.role ? avatarColors[user.role] : 'bg-gray-700'
  const roleLabel  = user?.role ? roleLabels[user.role]   : ''
  const currentAvatar = avatarPreview ?? user?.avatar_url ?? null

  return (
    <>
      <header className="flex items-center justify-between h-14 px-6 border-b bg-white shrink-0">
        {/* Left — page title */}
        <h2 className="text-base font-semibold text-gray-700 hidden sm:block">
          {title ?? ''}
        </h2>

        {/* Right — user area */}
        <div className="flex items-center gap-3 ml-auto relative">

          {/* Greeting — visible on medium screens and up */}
          <div className="hidden md:flex flex-col items-end leading-tight">
            <span className="text-xs text-gray-400">
              {greeting()}, {roleLabel}
            </span>
            <span className="text-sm font-semibold text-gray-800">{user?.full_name}</span>
          </div>

          {/* Avatar button */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className={cn(
              'h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 overflow-hidden shrink-0',
              !currentAvatar && avatarBg
            )}
          >
            {currentAvatar
              ? <img src={currentAvatar} alt="avatar" className="h-full w-full object-cover" />
              : initials
            }
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />

              <div className="absolute right-0 top-11 w-64 rounded-xl shadow-xl bg-white border z-50 overflow-hidden">
                {/* User info card */}
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-11 w-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden',
                      !currentAvatar && avatarBg
                    )}>
                      {currentAvatar
                        ? <img src={currentAvatar} alt="avatar" className="h-full w-full object-cover" />
                        : initials
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      {user?.role && (
                        <span className={cn(
                          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mt-1',
                          roleColors[user.role]
                        )}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={openProfile}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM20 21a8 8 0 10-16 0" />
                    </svg>
                    My Profile
                  </button>

                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => { setMenuOpen(false); setPwOpen(true) }}
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>

                  <hr className="my-1" />

                  <button
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={() => signOut()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* My Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
          </DialogHeader>

          {/* Avatar upload area */}
          <div className="flex items-center gap-5 py-2">
            <div className="relative group">
              <div className={cn(
                'h-20 w-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden border-2 border-white shadow',
                !currentAvatar && avatarBg
              )}>
                {currentAvatar
                  ? <img src={currentAvatar} alt="avatar" className="h-full w-full object-cover" />
                  : initials
                }
              </div>
              {/* Camera overlay */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setAvatarFile(file)
                    setAvatarPreview(URL.createObjectURL(file))
                  }
                }}
              />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.full_name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {user?.role && (
                <span className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold mt-1',
                  roleColors[user.role]
                )}>
                  {roleLabel}
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">Hover photo to change</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={profileBirthday}
                  onChange={e => setProfileBirthday(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input
                  value={profileMobile}
                  onChange={e => setProfileMobile(e.target.value)}
                  placeholder="+94 77 000 0000"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>ID Number (NIC / Passport)</Label>
              <Input
                value={profileIdNumber}
                onChange={e => setProfileIdNumber(e.target.value)}
                placeholder="e.g. 123456789V"
              />
            </div>

            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                value={profileAddress}
                onChange={e => setProfileAddress(e.target.value)}
                placeholder="Street, City"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={profileLoading}>
              {profileLoading ? 'Saving…' : 'Save Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {pwError && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{pwError}</p>}
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password" />
            </div>
            <Button className="w-full" onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Save Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
