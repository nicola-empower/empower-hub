// src/components/InvoicePdfLayout.tsx
import React, { FC } from 'react';

// --- Type Definitions ---
type LineItem = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

type InvoicePdfLayoutProps = {
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

const InvoicePdfLayout: FC<InvoicePdfLayoutProps> = ({
  clientName,
  clientAddress,
  clientEmail,
  invoiceNumber,
  invoiceDate,
  items,
  subTotal,
  taxAmount,
  finalTotal,
}) => {
  return (
    // We're using Tailwind CSS classes with smaller text and padding here
    // to ensure the entire invoice fits on a single A4 page.
    <div className="p-6 text-sm">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b">
        <div>
          <img src="https://empowervaservices.co.uk/wp-content/uploads/2025/07/cropped-cropped-cropped-green-logo.png" alt="Logo" className="h-12" />
          <h1 className="text-2xl font-bold text-teal-900 mt-1">INVOICE</h1>
        </div>
        <div className="text-right">
          <p className="font-bold text-base text-gray-800">Empower VA Services</p>
          <p>Chapel Drive, Stenhousemuir</p>
          <p>nicola@empowervaservices.co.uk</p>
        </div>
      </div>
      {/* Details */}
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800">Invoice to:</h3>
          <p className="font-medium text-teal-900">{clientName}</p>
          <p className="whitespace-pre-line">{clientAddress}</p>
          <p className="text-gray-600">{clientEmail}</p>
        </div>
        <div className="text-right">
          <p><strong>Invoice Date:</strong> {invoiceDate}</p>
          <p><strong>Invoice Number:</strong> {invoiceNumber}</p>
          <p className="font-bold text-xl text-teal-900 mt-2">Total due: £{finalTotal.toFixed(2)}</p>
        </div>
      </div>
      {/* Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-emerald-700 text-white">
            <th className="p-2 text-left font-semibold">SERVICE</th>
            <th className="p-2 text-center font-semibold">QTY</th>
            <th className="p-2 text-center font-semibold">PRICE</th>
            <th className="p-2 text-right font-semibold">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b">
              <td className="p-3 font-medium">{item.description}</td>
              <td className="p-3 text-center">{item.qty}</td>
              <td className="p-3 text-center">£{item.price.toFixed(2)}</td>
              <td className="p-3 text-right">£{(item.qty * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Totals */}
      <div className="flex justify-end mt-4">
        <div className="w-1/2">
          <div className="flex justify-between py-1 border-b"><span>Sub-total:</span><span>£{subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between py-1 border-b"><span>Tax (20%):</span><span>£{taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between p-2 text-lg font-bold bg-emerald-500 text-white rounded-b-lg"><span>Total:</span><span>£{finalTotal.toFixed(2)}</span></div>
        </div>
      </div>
      {/* --- Payment Info --- */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h3 className="font-bold text-gray-800 text-base mb-1">Payment Details</h3>
        <p>Please make payment via bank transfer to the following account:</p>
        <div className="mt-2 p-2 bg-gray-100 rounded-lg">
          <p className="font-bold">Nicola Berry</p>
          <p><strong>Sort Code:</strong> <span className="font-mono">00-00-00</span></p>
          <p><strong>Account Number:</strong> <span className="font-mono">00000000</span></p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePdfLayout;