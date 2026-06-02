'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types/database.types'

type NavItem = {
  label: string
  href: string
  roles: UserRole[]
  showLowStockBadge?: boolean
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'OWNER'] },
  { label: 'Products', href: '/products', roles: ['ADMIN', 'OWNER', 'CASHIER', 'STORE_KEEPER'], showLowStockBadge: true },
  { label: 'Categories', href: '/categories', roles: ['ADMIN', 'OWNER'] },
  { label: 'Suppliers', href: '/suppliers', roles: ['ADMIN', 'OWNER'] },
  { label: 'Customers', href: '/customers', roles: ['ADMIN', 'OWNER', 'CASHIER'] },
  { label: 'Purchases / GRN', href: '/purchases', roles: ['ADMIN', 'OWNER', 'STORE_KEEPER'] },
  { label: 'Sales / POS', href: '/sales', roles: ['ADMIN', 'OWNER', 'CASHIER'] },
  { label: 'Returns', href: '/returns', roles: ['ADMIN', 'OWNER', 'CASHIER'] },
  { label: 'Stock Adjustments', href: '/stock-adjustments', roles: ['ADMIN', 'OWNER', 'STORE_KEEPER'] },
  {
    label: 'Reports',
    href: '/reports',
    roles: ['ADMIN', 'OWNER'],
    children: [
      { label: 'Daily Report', href: '/reports/daily' },
      { label: 'Monthly Report', href: '/reports/monthly' },
      { label: 'Top Products', href: '/reports/top-products' },
      { label: 'Low Stock', href: '/reports/low-stock' },
      { label: 'Cash Summary', href: '/reports/cash-summary' },
    ],
  },
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
      // Column-to-column comparison needs JS-side filtering
      const { data } = await supabase
        .from('products')
        .select('stock_quantity, reorder_level')
        .eq('is_active', true)
      const count = (data ?? []).filter(p => p.stock_quantity <= p.reorder_level).length
      setLowStockCount(count)
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

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isReportsGroup = item.children && item.children.length > 0
          const isGroupActive = pathname.startsWith(item.href)
          const isExactActive = pathname === item.href

          if (isReportsGroup) {
            return (
              <div key={item.href}>
                <div className={cn(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300',
                  isGroupActive && 'text-white'
                )}>
                  <span>{item.label}</span>
                </div>
                <div className="ml-3 space-y-0.5">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
                          childActive
                            ? 'bg-gray-700 text-white font-medium'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        )}
                      >
                        <span className="mr-2 text-gray-600">›</span>
                        {child.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          const isActive = isExactActive || (!isReportsGroup && isGroupActive)
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
