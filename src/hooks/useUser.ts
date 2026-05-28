'use client'

import { createContext, useContext } from 'react'
import type { AppUser } from '@/types/database.types'

type UserContextType = {
  user: AppUser | null
}

export const UserContext = createContext<UserContextType>({ user: null })

export function useUser() {
  return useContext(UserContext)
}
