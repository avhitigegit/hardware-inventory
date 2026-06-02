import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { zeroPad } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a', maxWidth: 300 },
  center: { textAlign: 'center' },
  shopName: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 2 },
  shopDetail: { fontSize: 9, color: '#6b7280', textAlign: 'center' },
  divider: { borderBottom: '1 solid #e5e7eb', marginVertical: 8 },
  receiptNo: { fontSize: 12, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginVertical: 6 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, color: '#6b7280' },
  value: { flex: 1 },
  tableHeader: { flexDirection: 'row', borderBottom: '1 solid #374151', paddingBottom: 4, marginBottom: 4 },
  tableRow: { flexDirection: 'row', marginBottom: 3 },
  col1: { flex: 3 },
  col2: { width: 30, textAlign: 'center' },
  col3: { width: 60, textAlign: 'right' },
  col4: { width: 60, textAlign: 'right' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  totalSection: { borderTop: '1 solid #e5e7eb', paddingTop: 8, marginTop: 8 },
  totalRow: { flexDirection: 'row', marginBottom: 3 },
  totalLabel: { flex: 1, color: '#6b7280' },
  totalValue: { width: 70, textAlign: 'right' },
  grandTotal: { flexDirection: 'row', marginTop: 4 },
  grandTotalLabel: { flex: 1, fontFamily: 'Helvetica-Bold' },
  grandTotalValue: { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  changeRow: { flexDirection: 'row', marginTop: 6 },
  changeLabel: { flex: 1, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  changeValue: { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#16a34a' },
  creditLabel: { color: '#d97706', fontFamily: 'Helvetica-Bold', textAlign: 'center', marginTop: 8 },
  footer: { marginTop: 16, textAlign: 'center', fontSize: 9, color: '#9ca3af' },
})

function formatColomboPdf(isoString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(isoString))
}

type SaleReceiptProps = {
  sale: any
}

export default function SaleReceipt({ sale }: SaleReceiptProps) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Shop'
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? ''
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE ?? ''

  const items = sale.sale_items ?? []
  const change = sale.payment_type === 'CASH'
    ? Math.max(0, (sale.paid_amount ?? 0) - sale.total_amount)
    : 0

  return (
    <Document>
      <Page size={[226, 600]} style={styles.page}>
        <Text style={styles.shopName}>{shopName}</Text>
        {shopAddress ? <Text style={styles.shopDetail}>{shopAddress}</Text> : null}
        {shopPhone ? <Text style={styles.shopDetail}>Tel: {shopPhone}</Text> : null}

        <View style={styles.divider} />

        <Text style={styles.receiptNo}>RECEIPT — REC-{zeroPad(sale.id, 6)}</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{formatColomboPdf(sale.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cashier:</Text>
          <Text style={styles.value}>{sale.users?.full_name ?? '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>{sale.customers?.name ?? 'Walk-in Customer'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.col1, styles.th]}>Item</Text>
          <Text style={[styles.col2, styles.th]}>Qty</Text>
          <Text style={[styles.col3, styles.th]}>Price</Text>
          <Text style={[styles.col4, styles.th]}>Total</Text>
        </View>
        {items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.products?.name ?? '—'}</Text>
            <Text style={styles.col2}>{item.quantity}</Text>
            <Text style={styles.col3}>Rs. {Number(item.unit_price).toFixed(2)}</Text>
            <Text style={styles.col4}>Rs. {Number(item.total_price).toFixed(2)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalSection}>
          {Number(sale.discount_amount ?? 0) > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>Rs. {(Number(sale.total_amount) + Number(sale.discount_amount)).toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#16a34a' }]}>Discount</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>− Rs. {Number(sale.discount_amount).toFixed(2)}</Text>
              </View>
            </>
          )}
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Amount</Text>
            <Text style={styles.grandTotalValue}>Rs. {Number(sale.total_amount).toFixed(2)}</Text>
          </View>
          <View style={[styles.row, { marginTop: 4 }]}>
            <Text style={styles.totalLabel}>Payment Type</Text>
            <Text style={[styles.totalValue, { fontFamily: 'Helvetica-Bold' }]}>{sale.payment_type}</Text>
          </View>

          {sale.payment_type === 'CASH' && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Received</Text>
                <Text style={styles.totalValue}>Rs. {Number(sale.paid_amount ?? sale.total_amount).toFixed(2)}</Text>
              </View>
              <View style={styles.changeRow}>
                <Text style={styles.changeLabel}>Change</Text>
                <Text style={styles.changeValue}>Rs. {change.toFixed(2)}</Text>
              </View>
            </>
          )}

          {sale.payment_type === 'CREDIT' && (
            <Text style={styles.creditLabel}>On Credit — {sale.customers?.name ?? 'Customer'}</Text>
          )}

          {sale.payment_type === 'SPLIT' && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Cash Paid</Text>
                <Text style={styles.totalValue}>Rs. {Number(sale.paid_amount ?? 0).toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#d97706' }]}>On Credit</Text>
                <Text style={[styles.totalValue, { color: '#d97706' }]}>Rs. {Number(sale.balance_amount ?? 0).toFixed(2)}</Text>
              </View>
              {sale.customers?.name && (
                <Text style={styles.creditLabel}>Credit: {sale.customers.name}</Text>
              )}
            </>
          )}
        </View>

        <Text style={styles.footer}>Thank you for your purchase!</Text>
      </Page>
    </Document>
  )
}
