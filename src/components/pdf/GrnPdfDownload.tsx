'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import GrnDocument from './GrnDocument'
import { zeroPad } from '@/lib/utils'

type Props = {
  purchase: any
  receivedBy: string
}

export default function GrnPdfDownload({ purchase, receivedBy }: Props) {
  return (
    <PDFDownloadLink
      document={<GrnDocument purchase={purchase} receivedBy={receivedBy} />}
      fileName={`GRN-${zeroPad(purchase.id, 6)}.pdf`}
    >
      {({ loading }) => (
        <button
          className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Preparing…' : 'Print GRN'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
