import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateSession } from '@/lib/supabase/middleware'

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Public routes — accessible without authentication
  const publicRoutes = ['/login', '/forgot-password', '/reset-password']
  if (!user) {
    if (publicRoutes.includes(pathname)) return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 12-hour session expiry check
  const loginAtRaw = request.cookies.get('session_login_at')?.value
  if (loginAtRaw) {
    const loginAt = parseInt(loginAtRaw, 10)
    if (!isNaN(loginAt) && Date.now() - loginAt > SESSION_DURATION_MS) {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/login?reason=expired', request.url))
      response.cookies.delete('session_login_at')
      return response
    }
  }

  // Use service role to bypass RLS — ensures we always get the user row
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: userData } = await admin
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Deactivated user — sign out and redirect to login
  if (!userData || userData.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?deactivated=true', request.url))
  }

  // Allow authenticated user to stay on reset-password to set new password
  if (pathname === '/reset-password') return supabaseResponse

  // ADMIN-only routes
  if (pathname.startsWith('/users') && userData.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // CASHIER cannot access Sales History — POS Terminal only
  if (pathname === '/sales' && userData.role === 'CASHIER') {
    return NextResponse.redirect(new URL('/sales/pos', request.url))
  }

  // ADMIN/OWNER-only routes — CASHIER and STORE_KEEPER redirected to their home
  const ownerAdminOnly = ['/dashboard', '/reports']
  const isRestricted = ownerAdminOnly.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isRestricted && !['ADMIN', 'OWNER'].includes(userData.role)) {
    const fallback = userData.role === 'CASHIER' ? '/sales/pos' : '/purchases'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  // Authenticated user visiting /login — redirect by role
  if (pathname === '/login') {
    const role = userData.role
    if (role === 'CASHIER') return NextResponse.redirect(new URL('/sales/pos', request.url))
    if (role === 'STORE_KEEPER') return NextResponse.redirect(new URL('/purchases', request.url))
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
