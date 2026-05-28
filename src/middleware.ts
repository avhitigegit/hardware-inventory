import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // No session — allow /login, block everything else
  if (!user) {
    if (pathname === '/login') return supabaseResponse
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated — fetch role and active status
  const { data: userData } = await supabase
    .from('users')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // Deactivated user — sign out and redirect to login
  if (!userData || userData.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?deactivated=true', request.url))
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
