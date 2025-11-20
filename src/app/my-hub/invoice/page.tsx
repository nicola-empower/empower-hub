// src/app/my-hub/invoice/page.tsx
'use client';

import { useState, useMemo, Fragment, Suspense } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// --- Type Definitions ---
type LineItem = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

// Dynamically import the PDF component to ensure it's only loaded on the client side
const InvoicePdf = dynamic(() => import('@/components/InvoicePdf').then((mod) => mod.InvoicePdf), {
  ssr: false,
  loading: () => (
    <button
      className="w-full py-3 bg-gray-400 text-white font-bold rounded-lg flex items-center justify-center gap-2 mt-4"
      disabled={true}
    >
      Loading PDF Button...
    </button>
  ),
});

// --- Main Invoice Page Component ---
export default function InvoiceGeneratorPage() {
  // State for all invoice details
  const [clientName, setClientName] = useState('The Next Big Thing Ltd.');
  const [clientAddress, setClientAddress] = useState('101 Project Lane, Cityville, CV1 2AB');
  const [clientEmail, setClientEmail] = useState('contact@example.com');
  const [invoiceNumber, setInvoiceNumber] = useState('EMPOWER-2025-007');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<LineItem[]>([
    { id: 1, description: 'Business System Admin', qty: 1, price: 500 },
    { id: 2, description: 'Client Onboarding System', qty: 1, price: 1000 },
  ]);

  // --- Functions to manage line items ---
  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), description: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // --- Dynamic Calculations ---
  const { subTotal, taxAmount, finalTotal } = useMemo(() => {
    const subTotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const taxRate = 0.20; // 20% VAT
    const taxAmount = subTotal * taxRate;
    const finalTotal = subTotal + taxAmount;
    return { subTotal, taxAmount, finalTotal };
  }, [items]);

  return (
    <Fragment>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Generator</h1>
        <p className="text-lg text-gray-600 mt-1">Create and preview professional invoices instantly.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- FORM SECTION --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 space-y-6">
          <h3 className="text-xl font-bold">Invoice Details</h3>
          {/* Client Info */}
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="w-full p-2 border rounded-lg" />
          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Client Address" className="w-full p-2 border rounded-lg" rows={3}></textarea>
          <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Client Email" className="w-full p-2 border rounded-lg" />
          <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Invoice #" className="w-full p-2 border rounded-lg" />
          <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          
          {/* Line Items */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">Services</h4>
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                <input type="text" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Service Description" className="col-span-6 p-2 border rounded-lg" />
                <input type="number" value={item.qty} onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value))} className="col-span-2 p-2 border rounded-lg" />
                <input type="number" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value))} className="col-span-3 p-2 border rounded-lg" />
                <button onClick={() => handleRemoveItem(item.id)} className="col-span-1 text-red-500 hover:text-red-700"><FaTrash /></button>
              </div>
            ))}
            <button onClick={handleAddItem} className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2"><FaPlus /> Add Service</button>
          </div>
          
          {/* Dynamically loaded PDF Download button */}
          <Suspense fallback={<div>Loading...</div>}>
            <InvoicePdf
              clientName={clientName}
              clientAddress={clientAddress}
              clientEmail={clientEmail}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
              items={items}
              subTotal={subTotal}
              taxAmount={taxAmount}
              finalTotal={finalTotal}
            />
          </Suspense>
        </div>

        {/* --- PREVIEW SECTION --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 lg:p-8">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b-2">
                <div>
                    <img src="https://empowervaservices.co.uk/wp-content/uploads/2025/07/cropped-cropped-cropped-green-logo.png" alt="Logo" className="h-12 lg:h-16" />
                    <h1 className="text-xl lg:text-3xl font-bold text-teal-900 mt-1">INVOICE</h1>
                </div>
                <div className="text-right text-sm lg:text-base">
                    <p className="font-bold text-gray-800">Empower VA Services</p>
                    <p>Chapel Drive, Stenhousemuir</p>
                    <p>nicola@empowervaservices.co.uk</p>
                </div>
            </div>
            {/* Details */}
            <div className="flex justify-between mb-4 text-sm lg:text-base">
                <div>
                    <h3 className="font-bold text-gray-800">Invoice to:</h3>
                    <p className="font-medium text-teal-900">{clientName}</p>
                    <p className="whitespace-pre-line">{clientAddress}</p>
                    <p className="text-gray-600">{clientEmail}</p>
                </div>
                <div className="text-right">
                    <p><strong>Invoice Date:</strong> {invoiceDate}</p>
                    <p><strong>Invoice Number:</strong> {invoiceNumber}</p>
                    <p className="font-bold text-xl lg:text-2xl text-teal-900 mt-2">Total due: £{finalTotal.toFixed(2)}</p>
                </div>
            </div>
            {/* Table */}
            <table className="w-full border-collapse text-sm lg:text-base">
                <thead>
                    <tr className="bg-emerald-700 text-white">
                        <th className="p-2 lg:p-3 text-left font-semibold">SERVICE</th>
                        <th className="p-2 lg:p-3 text-center font-semibold">QTY</th>
                        <th className="p-2 lg:p-3 text-center font-semibold">PRICE</th>
                        <th className="p-2 lg:p-3 text-right font-semibold">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2 lg:p-4 font-medium">{item.description}</td>
                            <td className="p-2 lg:p-4 text-center">{item.qty}</td>
                            <td className="p-2 lg:p-4 text-center">£{item.price.toFixed(2)}</td>
                            <td className="p-2 lg:p-4 text-right">£{(item.qty * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* Totals */}
            <div className="flex justify-end mt-4 text-sm lg:text-base">
                <div className="w-full lg:w-1/2">
                    <div className="flex justify-between py-1 border-b"><span>Sub-total:</span><span>£{subTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between py-1 border-b"><span>Tax (20%):</span><span>£{taxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2 text-lg lg:text-xl font-bold bg-emerald-500 text-white rounded-b-lg"><span>Total:</span><span>£{finalTotal.toFixed(2)}</span></div>
                </div>
            </div>
            
            {/* --- Payment Info --- */}
            <div className="mt-4 pt-4 border-t-2 border-gray-200 text-sm lg:text-base">
                <h3 className="font-bold text-gray-800 text-base mb-1">Payment Details</h3>
                <p>Please make payment via bank transfer to the following account:</p>
                <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                    <p className="font-bold">Nicola Berry</p>
                    <p><strong>Sort Code:</strong> <span className="font-mono">00-00-00</span></p>
                    <p><strong>Account Number:</strong> <span className="font-mono">00000000</span></p>
                </div>
            </div>
        </div>
      </div>
    </Fragment>
  );
}