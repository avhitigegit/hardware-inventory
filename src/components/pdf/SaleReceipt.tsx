import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { zeroPad } from '@/lib/utils'

// Page: 400pt wide, padding 24 each side → 352pt usable content
const PAD = 24

const s = StyleSheet.create({
  page: {
    paddingHorizontal: PAD,
    paddingTop: 24,
    paddingBottom: 28,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111111',
    backgroundColor: '#ffffff',
  },

  // ── Header ───────────────────────────────────────────────────
  shopName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  shopSub: {
    fontSize: 8.5,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 2,
  },

  // ── Dividers ─────────────────────────────────────────────────
  solidLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'solid',
    marginVertical: 10,
  },
  dashLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    borderBottomStyle: 'dashed',
    marginVertical: 8,
  },
  thickLine: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#374151',
    borderBottomStyle: 'solid',
    marginVertical: 0,
  },

  // ── Receipt number ────────────────────────────────────────────
  receiptBlock: {
    alignItems: 'center',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: 8,
    color: '#9ca3af',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 2,
  },
  receiptNo: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // ── Meta rows ─────────────────────────────────────────────────
  metaSection: {
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  metaLabel: {
    width: 68,
    fontSize: 8.5,
    color: '#6b7280',
  },
  metaColon: {
    width: 10,
    fontSize: 8.5,
    color: '#6b7280',
  },
  metaValue: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },

  // ── Items table ───────────────────────────────────────────────
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'center',
  },
  thItem:  { flex: 1,   fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', paddingRight: 6 },
  thQty:   { width: 34, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', textAlign: 'center' },
  thPrice: { width: 78, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', textAlign: 'right' },
  thTotal: { width: 78, fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', textAlign: 'right' },

  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    borderBottomStyle: 'solid',
    alignItems: 'flex-start',
  },
  tdItem:  { flex: 1,   fontSize: 9,  color: '#111111', paddingRight: 6 },
  tdQty:   { width: 34, fontSize: 9,  color: '#374151', textAlign: 'center' },
  tdPrice: { width: 78, fontSize: 9,  color: '#374151', textAlign: 'right' },
  tdTotal: { width: 78, fontSize: 9,  fontFamily: 'Helvetica-Bold', color: '#111111', textAlign: 'right' },

  // ── Totals ────────────────────────────────────────────────────
  totalsSection: {
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center',
  },
  summaryLabel: {
    flex: 1,
    fontSize: 9,
    color: '#6b7280',
  },
  summaryValue: {
    width: 100,
    fontSize: 9,
    textAlign: 'right',
    color: '#374151',
  },

  grandTotalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 4,
    borderTopWidth: 2,
    borderTopColor: '#111111',
    borderTopStyle: 'solid',
    borderBottomWidth: 2,
    borderBottomColor: '#111111',
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    width: 100,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: '#111111',
  },

  // Cash change box
  changeBox: {
    flexDirection: 'row',
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    alignItems: 'center',
  },
  changeLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  changeValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    textAlign: 'right',
  },

  // Credit box
  creditBox: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fffbeb',
    borderRadius: 4,
  },
  creditTitle: {
    fontSize: 8,
    letterSpacing: 1,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 3,
  },
  creditAmount: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#d97706',
    textAlign: 'center',
  },
  creditCustomer: {
    fontSize: 8,
    color: '#92400e',
    textAlign: 'center',
    marginTop: 3,
  },

  // ── Footer ────────────────────────────────────────────────────
  footer: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    borderTopStyle: 'dashed',
    textAlign: 'center',
    fontSize: 8.5,
    color: '#9ca3af',
  },
  footerSub: {
    textAlign: 'center',
    fontSize: 8,
    color: '#d1d5db',
    marginTop: 3,
  },
})

function formatDate(iso: string) {
  const d = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
  // "03/06/2026, 17:11" → "03/06/2026  17:11"
  return d.replace(',', ' ')
}

function rs(n: number) {
  return `Rs. ${n.toFixed(2)}`
}

function qty(n: number) {
  return n % 1 === 0 ? String(n) : n.toFixed(2)
}

export default function SaleReceipt({ sale }: { sale: any }) {
  const shopName    = process.env.NEXT_PUBLIC_SHOP_NAME    ?? 'Hardware Shop'
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? ''
  const shopPhone   = process.env.NEXT_PUBLIC_SHOP_PHONE   ?? ''

  const items    = sale.sale_items ?? []
  const discount = Number(sale.discount_amount ?? 0)
  const total    = Number(sale.total_amount)
  const subtotal = total + discount
  const paid     = Number(sale.paid_amount ?? 0)
  const balance  = Number(sale.balance_amount ?? 0)
  const change   = sale.payment_type === 'CASH' ? Math.max(0, paid - total) : 0

  return (
    // hyphenationCallback prevents word-breaking / hyphenation in all text nodes
    <Document hyphenationCallback={(word) => [word]}>
      <Page size={[400, 840]} style={s.page}>

        {/* ── Shop header ── */}
        <Text style={s.shopName}>{shopName}</Text>
        {shopAddress ? <Text style={s.shopSub}>{shopAddress}</Text> : null}
        {shopPhone   ? <Text style={s.shopSub}>Tel: {shopPhone}</Text> : null}

        <View style={s.solidLine} />

        {/* ── Receipt number ── */}
        <View style={s.receiptBlock}>
          <Text style={s.receiptLabel}>RECEIPT</Text>
          <Text style={s.receiptNo}>REC-{zeroPad(sale.id, 6)}</Text>
        </View>

        <View style={s.solidLine} />

        {/* ── Meta info ── */}
        <View style={s.metaSection}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Date</Text>
            <Text style={s.metaColon}>:</Text>
            <Text style={s.metaValue}>{formatDate(sale.created_at)}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Cashier</Text>
            <Text style={s.metaColon}>:</Text>
            <Text style={s.metaValue}>{sale.users?.full_name ?? '—'}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Customer</Text>
            <Text style={s.metaColon}>:</Text>
            <Text style={s.metaValue}>{sale.customers?.name ?? 'Walk-in Customer'}</Text>
          </View>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Payment</Text>
            <Text style={s.metaColon}>:</Text>
            <Text style={s.metaValue}>{sale.payment_type}</Text>
          </View>
        </View>

        <View style={s.solidLine} />

        {/* ── Items table header ── */}
        <View style={s.tableHeaderRow}>
          <Text style={s.thItem}>ITEM</Text>
          <Text style={s.thQty}>QTY</Text>
          <Text style={s.thPrice}>UNIT PRICE</Text>
          <Text style={s.thTotal}>AMOUNT</Text>
        </View>
        <View style={s.thickLine} />

        {/* ── Items ── */}
        {items.map((item: any, i: number) => (
          <View key={i} style={s.tableDataRow}>
            <Text style={s.tdItem}>{item.products?.name ?? '—'}</Text>
            <Text style={s.tdQty}>{qty(Number(item.quantity))}</Text>
            <Text style={s.tdPrice}>{rs(Number(item.unit_price))}</Text>
            <Text style={s.tdTotal}>{rs(Number(item.total_price))}</Text>
          </View>
        ))}

        {/* ── Totals ── */}
        <View style={s.totalsSection}>

          {discount > 0 && (
            <>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryValue}>{rs(subtotal)}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={[s.summaryLabel, { color: '#16a34a' }]}>Discount</Text>
                <Text style={[s.summaryValue, { color: '#16a34a' }]}>- {rs(discount)}</Text>
              </View>
            </>
          )}

          <View style={s.grandTotalRow}>
            <Text style={s.grandTotalLabel}>TOTAL</Text>
            <Text style={s.grandTotalValue}>{rs(total)}</Text>
          </View>

          {/* CASH */}
          {sale.payment_type === 'CASH' && (
            <>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Amount Received</Text>
                <Text style={s.summaryValue}>{rs(paid)}</Text>
              </View>
              <View style={s.changeBox}>
                <Text style={s.changeLabel}>Change</Text>
                <Text style={s.changeValue}>{rs(change)}</Text>
              </View>
            </>
          )}

          {/* CREDIT */}
          {sale.payment_type === 'CREDIT' && (
            <View style={s.creditBox}>
              <Text style={s.creditTitle}>ON CREDIT</Text>
              <Text style={s.creditAmount}>{rs(balance)}</Text>
              {sale.customers?.name ? (
                <Text style={s.creditCustomer}>{sale.customers.name}</Text>
              ) : null}
            </View>
          )}

          {/* SPLIT */}
          {sale.payment_type === 'SPLIT' && (
            <>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Cash Paid</Text>
                <Text style={s.summaryValue}>{rs(paid)}</Text>
              </View>
              <View style={s.creditBox}>
                <Text style={s.creditTitle}>ON CREDIT</Text>
                <Text style={s.creditAmount}>{rs(balance)}</Text>
                {sale.customers?.name ? (
                  <Text style={s.creditCustomer}>{sale.customers.name}</Text>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* ── Footer ── */}
        <Text style={s.footer}>Thank you for your purchase!</Text>
        <Text style={s.footerSub}>Please retain this receipt for your records.</Text>

      </Page>
    </Document>
  )
}
