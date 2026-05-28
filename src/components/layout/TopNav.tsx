'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { signOut } from '@/actions/auth.actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export default function TopNav({ title }: { title?: string }) {
  const { user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pwDialogOpen, setPwDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')

  const handleChangePassword = async () => {
    setPwError('')
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    setPwLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) {
      setPwError(error.message)
    } else {
      toast.success('Password changed successfully.')
      setPwDialogOpen(false)
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <>
      <header className="flex items-center justify-between h-14 px-6 border-b bg-white">
        <h2 className="text-base font-semibold text-gray-800">
          {title ?? 'Dashboard'}
        </h2>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span className="hidden sm:inline">{user?.full_name}</span>
            <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">
              {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white border z-50">
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => { setMenuOpen(false); setPwDialogOpen(true) }}
              >
                Change Password
              </button>
              <hr />
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => signOut()}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {pwError && (
              <p className="text-sm text-red-600">{pwError}</p>
            )}
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleChangePassword}
              disabled={pwLoading}
            >
              {pwLoading ? 'Saving…' : 'Save Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
