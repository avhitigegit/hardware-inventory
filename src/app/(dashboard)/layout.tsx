import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/actions/auth.actions'

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000
import { UserProvider } from '@/components/layout/UserProvider'
import Sidebar from '@/components/layout/Sidebar'
import TopNav from '@/components/layout/TopNav'
import PendingGuard from '@/components/layout/PendingGuard'
import SessionGuard from '@/components/layout/SessionGuard'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const loginAtRaw = cookieStore.get('session_login_at')?.value
  const loginAt    = loginAtRaw ? parseInt(loginAtRaw, 10) : Date.now()
  const expiresAt  = loginAt + SESSION_DURATION_MS

  return (
    <UserProvider initialUser={user}>
      <SessionGuard expiresAt={expiresAt} />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNav />
          <PendingGuard>
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </PendingGuard>
        </div>
      </div>
    </UserProvider>
  )
}
