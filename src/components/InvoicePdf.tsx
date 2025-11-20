// src/components/InvoicePdf.tsx
'use client';

import React, { FC } from 'react';
import { FaDownload } from 'react-icons/fa';
import { Page, Text, View, Document, StyleSheet, Image, Font, PDFDownloadLink } from '@react-pdf/renderer';

// --- Type Definitions ---
type LineItem = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

// Register the font to handle emoji rendering
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@latest/OpenSans-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@latest/OpenSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Open Sans',
    padding: 30,
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  logo: {
    height: 48,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#115e59',
    marginTop: 5,
  },
  myInfo: {
    textAlign: 'right',
  },
  myInfoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subSection: {
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#115e59',
  },
  totalDue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#115e59',
    marginTop: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    height: 24,
  },
  tableHeader: {
    backgroundColor: '#047857',
    color: '#fff',
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderRightWidth: 1,
    borderColor: '#d1d5db',
  },
  descriptionCell: {
    width: '50%',
  },
  qtyCell: {
    width: '15%',
    textAlign: 'center',
  },
  priceCell: {
    width: '20%',
    textAlign: 'center',
  },
  totalCell: {
    width: '15%',
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBlock: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#34d399',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 5,
    borderRadius: 4,
  },
  paymentInfo: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  paymentInfoBlock: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
});

type InvoicePdfProps = {
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: LineItem[];
  subTotal: number;
  taxAmount: number;
  finalTotal: number;
};

// Create Document Component
const InvoicePdfDocument: FC<InvoicePdfProps> = ({
  clientName,
  clientAddress,
  clientEmail,
  invoiceNumber,
  invoiceDate,
  items,
  subTotal,
  taxAmount,
  finalTotal,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Image style={styles.logo} src="https://empowervaservices.co.uk/wp-content/uploads/2025/07/cropped-cropped-cropped-green-logo.png" />
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>
        <View style={styles.myInfo}>
          <Text style={styles.myInfoText}>Empower VA Services</Text>
          <Text>Chapel Drive, Stenhousemuir</Text>
          <Text>nicola@empowervaservices.co.uk</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.subSection}>
          <Text style={styles.sectionTitle}>Invoice to:</Text>
          <Text style={styles.clientName}>{clientName}</Text>
          <Text>{clientAddress}</Text>
          <Text>{clientEmail}</Text>
        </View>
        <View style={{ ...styles.subSection, textAlign: 'right' }}>
          <Text>
            <Text style={styles.bold}>Invoice Date:</Text> {invoiceDate}
          </Text>
          <Text>
            <Text style={styles.bold}>Invoice Number:</Text> {invoiceNumber}
          </Text>
          <Text style={styles.totalDue}>Total due: £{finalTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={{ ...styles.tableRow, ...styles.tableHeader }}>
          <Text style={{ ...styles.tableCell, ...styles.descriptionCell }}>SERVICE</Text>
          <Text style={{ ...styles.tableCell, ...styles.qtyCell }}>QTY</Text>
          <Text style={{ ...styles.tableCell, ...styles.priceCell }}>PRICE</Text>
          <Text style={{ ...styles.tableCell, ...styles.totalCell }}>TOTAL</Text>
        </View>
        {items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <Text style={{ ...styles.tableCell, ...styles.descriptionCell }}>{item.description}</Text>
            <Text style={{ ...styles.tableCell, ...styles.qtyCell }}>{item.qty}</Text>
            <Text style={{ ...styles.tableCell, ...styles.priceCell }}>£{item.price.toFixed(2)}</Text>
            <Text style={{ ...styles.tableCell, ...styles.totalCell }}>£{(item.qty * item.price).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.summary}>
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.bold}>Sub-total:</Text>
            <Text>£{subTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.bold}>Tax (20%):</Text>
            <Text>£{taxAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryTotal}>
            <Text>Total:</Text>
            <Text>£{finalTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Text style={{ ...styles.sectionTitle, marginBottom: 5 }}>Payment Details</Text>
        <Text>Please make payment via bank transfer to the following account:</Text>
        <View style={styles.paymentInfoBlock}>
          <Text style={styles.bold}>Nicola Berry</Text>
          <Text>
            <Text style={styles.bold}>Sort Code:</Text> <Text>00-00-00</Text>
          </Text>
          <Text>
            <Text style={styles.bold}>Account Number:</Text> <Text>00000000</Text>
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);


// Component to be dynamically imported and used in the main page
export const InvoicePdf: FC<InvoicePdfProps> = (props) => {
  return (
    <PDFDownloadLink
      document={<InvoicePdfDocument {...props} />}
      fileName={`invoice-${props.invoiceNumber}.pdf`}
    >
      {({ loading }) => (
        <button
          className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 mt-4 hover:bg-emerald-600 transition-colors duration-200"
          disabled={loading}
        >
          <FaDownload /> {loading ? 'Generating PDF...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
};