'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signOut } from '@/actions/auth.actions'

// How many ms before expiry to show the warning toast
const WARN_BEFORE_MS = 10 * 60 * 1000 // 10 minutes

export default function SessionGuard({ expiresAt }: { expiresAt: number }) {
  const router = useRouter()
  const warnTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastIdRef     = useRef<string | number | null>(null)

  useEffect(() => {
    const now       = Date.now()
    const msLeft    = expiresAt - now
    const msToWarn  = msLeft - WARN_BEFORE_MS

    if (msLeft <= 0) {
      // Already expired — sign out immediately (middleware should have caught this,
      // but handle it client-side as a safety net)
      signOut()
      return
    }

    // Schedule warning toast
    if (msToWarn > 0) {
      warnTimerRef.current = setTimeout(() => {
        toastIdRef.current = toast.warning(
          'Your session will expire in 10 minutes. Please save your work.',
          {
            duration: WARN_BEFORE_MS,
            action: {
              label: 'Stay logged in',
              onClick: () => {
                // Dismiss toast — the session timer is server-side so we
                // can't extend without a fresh login, but this lets the user
                // acknowledge the warning without alarm.
                if (toastIdRef.current != null) toast.dismiss(toastIdRef.current)
              },
            },
          }
        )
      }, msToWarn)
    } else {
      // Less than 10 minutes left — show warning immediately
      toastIdRef.current = toast.warning(
        `Your session expires in ${Math.max(1, Math.ceil(msLeft / 60000))} minute(s). Please save your work.`,
        { duration: msLeft }
      )
    }

    // Schedule auto-logout
    expireTimerRef.current = setTimeout(async () => {
      if (toastIdRef.current != null) toast.dismiss(toastIdRef.current)
      toast.error('Your session has expired. You have been logged out.', { duration: 4000 })
      // Small delay so the toast renders before navigation
      await new Promise(r => setTimeout(r, 800))
      await signOut()
    }, msLeft)

    return () => {
      if (warnTimerRef.current)   clearTimeout(warnTimerRef.current)
      if (expireTimerRef.current) clearTimeout(expireTimerRef.current)
    }
  }, [expiresAt, router])

  return null
}
