'use client'

import { UserContext } from '@/hooks/useUser'
import type { AppUser } from '@/types/database.types'

export function UserProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AppUser | null
}) {
  return (
    <UserContext.Provider value={{ user: initialUser }}>
      {children}
    </UserContext.Provider>
  )
}
