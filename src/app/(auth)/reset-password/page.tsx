'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Exchange the code from the URL for a valid session
    const code = searchParams.get('code')
    if (!code) {
      setError('Invalid or expired reset link. Please request a new one.')
      setExchanging(false)
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) {
        setError('This reset link has expired or already been used. Please request a new one.')
      }
      setExchanging(false)
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setSuccess(true)
    // Sign out so the user logs in fresh with the new password
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login?reset=true'), 2000)
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Inventory'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Set a new password</p>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 text-center space-y-2">
            <p className="font-medium">Password updated successfully!</p>
            <p>Redirecting you to sign in…</p>
          </div>
        ) : exchanging ? (
          <p className="text-center text-sm text-gray-500 py-4">Verifying reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {error}
                {error.includes('expired') && (
                  <div className="mt-2">
                    <a href="/forgot-password" className="underline font-medium">Request a new reset link →</a>
                  </div>
                )}
              </div>
            )}

            {!error && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input
                    type="password"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </Button>
              </>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
