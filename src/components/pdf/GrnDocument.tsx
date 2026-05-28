import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { zeroPad } from '@/lib/utils'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottom: '1 solid #e5e7eb', paddingBottom: 12 },
  shopName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  shopDetail: { fontSize: 9, color: '#6b7280' },
  grnTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 12, marginBottom: 2 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: '#6b7280' },
  value: { flex: 1 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: '6 4', borderBottom: '1 solid #e5e7eb' },
  tableRow: { flexDirection: 'row', padding: '5 4', borderBottom: '1 solid #f3f4f6' },
  col1: { flex: 3 },
  col2: { width: 40, textAlign: 'center' },
  col3: { width: 50, textAlign: 'center' },
  col4: { width: 70, textAlign: 'right' },
  col5: { width: 70, textAlign: 'right' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#374151' },
  totalRow: { flexDirection: 'row', padding: '8 4', borderTop: '1 solid #374151', marginTop: 4 },
  totalLabel: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', paddingRight: 8 },
  totalValue: { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  footer: { marginTop: 30, borderTop: '1 solid #e5e7eb', paddingTop: 10, fontSize: 9, color: '#6b7280' },
})

function formatColomboPdf(isoString: string) {
  const d = new Date(isoString)
  const colombo = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d)
  return colombo
}

type GrnDocumentProps = {
  purchase: any
  receivedBy: string
}

export default function GrnDocument({ purchase, receivedBy }: GrnDocumentProps) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? 'Hardware Shop'
  const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? ''
  const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE ?? ''

  const items = purchase.purchase_items ?? []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.shopName}>{shopName}</Text>
          {shopAddress ? <Text style={styles.shopDetail}>{shopAddress}</Text> : null}
          {shopPhone ? <Text style={styles.shopDetail}>Tel: {shopPhone}</Text> : null}
        </View>

        {/* GRN title + meta */}
        <Text style={styles.grnTitle}>GOODS RECEIVED NOTE</Text>
        <View style={styles.row}>
          <Text style={styles.label}>GRN Number:</Text>
          <Text style={[styles.value, { fontFamily: 'Helvetica-Bold' }]}>GRN-{zeroPad(purchase.id, 6)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date &amp; Time:</Text>
          <Text style={styles.value}>{formatColomboPdf(purchase.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Supplier:</Text>
          <Text style={styles.value}>{purchase.suppliers?.name ?? '—'}</Text>
        </View>
        {purchase.suppliers?.contact_person ? (
          <View style={styles.row}>
            <Text style={styles.label}>Contact Person:</Text>
            <Text style={styles.value}>{purchase.suppliers.contact_person}</Text>
          </View>
        ) : null}
        {purchase.suppliers?.phone ? (
          <View style={styles.row}>
            <Text style={styles.label}>Supplier Phone:</Text>
            <Text style={styles.value}>{purchase.suppliers.phone}</Text>
          </View>
        ) : null}
        {purchase.invoice_number ? (
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number:</Text>
            <Text style={styles.value}>{purchase.invoice_number}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Payment Type:</Text>
          <Text style={styles.value}>{purchase.payment_type}</Text>
        </View>

        {/* Items table */}
        <Text style={styles.sectionTitle}>Items Received</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.col1, styles.th]}>Product Name</Text>
          <Text style={[styles.col2, styles.th]}>Unit</Text>
          <Text style={[styles.col3, styles.th]}>Qty</Text>
          <Text style={[styles.col4, styles.th]}>Unit Price</Text>
          <Text style={[styles.col5, styles.th]}>Line Total</Text>
        </View>
        {items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.col1}>{item.products?.name ?? '—'}</Text>
            <Text style={styles.col2}>{item.products?.unit ?? '—'}</Text>
            <Text style={styles.col3}>{item.quantity}</Text>
            <Text style={styles.col4}>Rs. {Number(item.unit_price).toFixed(2)}</Text>
            <Text style={styles.col5}>Rs. {Number(item.total_price).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalValue}>Rs. {Number(purchase.total_amount).toFixed(2)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Received By: {receivedBy}</Text>
          {purchase.notes ? <Text style={{ marginTop: 4 }}>Notes: {purchase.notes}</Text> : null}
        </View>
      </Page>
    </Document>
  )
}
