'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCashSummary } from '@/actions/reports.actions'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

function todayColombo() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function SummaryCard({ title, value, sub, highlight }: { title: string; value: string; sub?: string; highlight?: 'green' | 'amber' | 'red' }) {
  const colors = {
    green: 'text-green-700',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }
  return (
    <div className="rounded-lg border bg-white p-5">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-2xl font-bold ${highlight ? colors[highlight] : 'text-gray-800'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function CashSummaryPage() {
  const [date, setDate] = useState(todayColombo())

  const { data, isLoading } = useQuery({
    queryKey: ['cash-summary', date],
    queryFn: async () => {
      const r = await getCashSummary(date)
      if (r.error) throw new Error(r.error)
      return r.data
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cash Summary</h1>
          <p className="text-sm text-gray-500">End-of-day cash reconciliation</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
      </div>

      {/* Net Cash — most important number */}
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6">
        <p className="text-sm font-medium text-green-700 mb-1">Net Cash in Drawer</p>
        {isLoading
          ? <Skeleton className="h-10 w-40" />
          : <p className="text-4xl font-bold text-green-700">{formatCurrency(data?.net_cash_in_drawer ?? 0)}</p>
        }
        <p className="text-xs text-green-600 mt-2">
          Cash sales + split cash received − cash refunds
        </p>
      </div>

      {/* Breakdown cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-white p-5 space-y-2">
                <Skeleton className="h-4 w-28" /><Skeleton className="h-8 w-24" />
              </div>
            ))
          : (
            <>
              <SummaryCard
                title="Cash Sales"
                value={formatCurrency(data?.cash_total ?? 0)}
                sub={`${data?.cash_sales_count ?? 0} transactions`}
                highlight="green"
              />
              <SummaryCard
                title="Split — Cash Portion"
                value={formatCurrency(data?.split_cash_total ?? 0)}
                sub={`${data?.split_sales_count ?? 0} split transactions`}
                highlight="green"
              />
              <SummaryCard
                title="Cash Refunds"
                value={`− ${formatCurrency(data?.returns_cash_refund ?? 0)}`}
                sub={`${data?.returns_count ?? 0} returns`}
                highlight={data?.returns_cash_refund ? 'red' : undefined}
              />
              <SummaryCard
                title="Credit Sales"
                value={formatCurrency(data?.credit_total ?? 0)}
                sub={`${data?.credit_sales_count ?? 0} transactions — not in drawer`}
                highlight="amber"
              />
              <SummaryCard
                title="Split — Credit Portion"
                value={formatCurrency(data?.split_credit_total ?? 0)}
                sub="Goes to customer credit balance"
                highlight="amber"
              />
              <SummaryCard
                title="Total Revenue"
                value={formatCurrency(
                  (data?.cash_total ?? 0) +
                  (data?.credit_total ?? 0) +
                  (data?.split_cash_total ?? 0) +
                  (data?.split_credit_total ?? 0)
                )}
                sub="All payment types combined"
              />
            </>
          )
        }
      </div>

      {/* Reconciliation guide */}
      <div className="rounded-lg border bg-white p-5 text-sm text-gray-600 space-y-2">
        <p className="font-semibold text-gray-800">How to reconcile</p>
        <p>1. Count physical cash in the drawer at end of day.</p>
        <p>2. Compare with <strong>Net Cash in Drawer</strong> above.</p>
        <p>3. Any difference should be investigated — check the sales log for the day.</p>
        <p className="text-xs text-gray-400 pt-1">Opening float is not tracked by the system — add it manually to your expected total.</p>
      </div>
    </div>
  )
}
