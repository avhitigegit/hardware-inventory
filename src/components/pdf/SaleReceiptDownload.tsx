'use client'

import { useState, useEffect } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import SaleReceipt from './SaleReceipt'
import { getSaleById } from '@/actions/sales.actions'
import { zeroPad } from '@/lib/utils'

type Props = {
  saleId: number
}

export default function SaleReceiptDownload({ saleId }: Props) {
  const [sale, setSale] = useState<any>(null)

  useEffect(() => {
    getSaleById(saleId).then(r => { if (!r.error) setSale(r.data) })
  }, [saleId])

  if (!sale) {
    return (
      <button className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-400" disabled>
        Loading…
      </button>
    )
  }

  return (
    <PDFDownloadLink
      document={<SaleReceipt sale={sale} />}
      fileName={`REC-${zeroPad(saleId, 6)}.pdf`}
      className="flex-1"
    >
      {({ loading }) => (
        <button
          className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Preparing…' : 'Print Receipt'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
