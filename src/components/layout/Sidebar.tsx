'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/types/database.types'

type NavItem = {
  label: string
  href: string
  roles: UserRole[]
  showLowStockBadge?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'OWNER'] },
  { label: 'Products', href: '/products', roles: ['ADMIN', 'OWNER', 'CASHIER', 'STORE_KEEPER'], showLowStockBadge: true },
  { label: 'Categories', href: '/categories', roles: ['ADMIN', 'OWNER'] },
  { label: 'Suppliers', href: '/suppliers', roles: ['ADMIN', 'OWNER'] },
  { label: 'Customers', href: '/customers', roles: ['ADMIN', 'OWNER', 'CASHIER'] },
  { label: 'Purchases / GRN', href: '/purchases', roles: ['ADMIN', 'OWNER', 'STORE_KEEPER'] },
  { label: 'Sales / POS', href: '/sales', roles: ['ADMIN', 'OWNER', 'CASHIER'] },
  { label: 'Stock Adjustments', href: '/stock-adjustments', roles: ['ADMIN', 'OWNER', 'STORE_KEEPER'] },
  { label: 'Reports', href: '/reports/daily', roles: ['ADMIN', 'OWNER'] },
  { label: 'Users', href: '/users', roles: ['ADMIN'] },
]

const roleBadgeColor: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  OWNER: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-green-100 text-green-700',
  STORE_KEEPER: 'bg-yellow-100 text-yellow-700',
}

export default function Sidebar() {
  const { user } = useUser()
  const pathname = usePathname()
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    const fetchLowStock = async () => {
      const supabase = createClient()
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lte('stock_quantity', 'reorder_level')
        .eq('is_active', true)
      setLowStockCount(count ?? 0)
    }
    if (user) fetchLowStock()
  }, [user])

  if (!user) return null

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role))

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold leading-tight">
          {process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Inventory'}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Management System</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <span>{item.label}</span>
              {item.showLowStockBadge && lowStockCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
        <span
          className={cn(
            'inline-block mt-1 rounded px-2 py-0.5 text-xs font-semibold',
            roleBadgeColor[user.role]
          )}
        >
          {user.role}
        </span>
      </div>
    </aside>
  )
}
