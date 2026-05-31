'use client'

import { Button } from '@/components/ui/button'

interface PaginationBarProps {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export default function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
  itemLabel = 'records',
}: PaginationBarProps) {
  if (total === 0) return null
  const safeTotal = Math.max(1, totalPages)
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-500">
        Page {page} of {safeTotal} — {total} {itemLabel}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= safeTotal}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
