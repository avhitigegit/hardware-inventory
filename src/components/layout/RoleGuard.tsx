'use client'

import { useUser } from '@/hooks/useUser'
import type { UserRole } from '@/types/database.types'

export function RoleGuard({
  roles,
  children,
}: {
  roles: UserRole[]
  children: React.ReactNode
}) {
  const { user } = useUser()
  if (!user || !roles.includes(user.role)) return null
  return <>{children}</>
}
