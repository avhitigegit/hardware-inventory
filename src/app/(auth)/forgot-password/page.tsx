'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('Enter your email address.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/reset-password`

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setSent(true)
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">
          {process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Inventory'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
              <p className="font-medium mb-1">Reset link sent!</p>
              <p>Check your email <strong>{email}</strong> for the password reset link. Click the link in the email to set a new password.</p>
            </div>
            <Link href="/login" className="block text-sm text-blue-600 hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">
              Enter your account email and we will send you a password reset link.
            </p>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
                ← Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
