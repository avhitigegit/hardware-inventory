'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { activateFromPending } from '@/actions/users.actions'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function PendingGuard({ children }: { children: React.ReactNode }) {
  const { user }  = useUser()
  const router    = useRouter()

  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [activated, setActivated] = useState(false)

  const isPending = !activated && user?.status === 'PENDING'

  const handleActivate = async () => {
    setError('')
    if (newPw.length < 8)    { setError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: pwError } = await supabase.auth.updateUser({ password: newPw })
    if (pwError) { setError(pwError.message); setLoading(false); return }
    const result = await activateFromPending()
    if (result.error) { setError(result.error); setLoading(false); return }
    setActivated(true)
    toast.success('Password set. Your account is now active!')
    router.refresh()
    setLoading(false)
  }

  // Not pending — render normally
  if (!isPending) return <>{children}</>

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col">

      {/* Blurred background content — not interactive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none blur-sm opacity-20">
        {children}
      </div>

      {/* Blocking overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">

          {/* Lock icon */}
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
            Account Pending Activation
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            You must set a new password to activate your account and access the system.
          </p>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat your new password"
                onKeyDown={e => e.key === 'Enter' && handleActivate()}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? 'Activating…' : 'Set Password & Activate Account'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            You cannot access the system until this step is completed.
          </p>
        </div>
      </div>
    </div>
  )
}
