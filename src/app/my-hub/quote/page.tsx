// src/app/my-hub/quote/page.tsx
'use client';

import { useState, Fragment } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Type Definitions ---
type LineItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

// The Master Price List from your code
const servicePriceList = {
    'hourly_admin': { name: 'General Admin/Tech Support (PAYG)', price: 35, unit: 'hour', category: 'Retainers & Hourly' },
    'retainer_10': { name: 'Spark Retainer (10 hours/month)', price: 325, unit: 'package', category: 'Retainers & Hourly' },
    'retainer_20': { name: 'Growth Retainer (20 hours/month)', price: 630, unit: 'package', category: 'Retainers & Hourly' },
    'retainer_40': { name: 'Scale Retainer (40 hours/month)', price: 1200, unit: 'package', category: 'Retainers & Hourly' },
    'gmail_auto_reply': { name: 'Gmail: Auto-reply to common inquiries', price: 45, unit: 'product', category: 'Gmail Automations' },
    'gmail_filter_label': { name: 'Gmail: Filter and label incoming emails', price: 40, unit: 'product', category: 'Gmail Automations' },
    'docs_gen_proposals': { name: 'Docs: Generate custom proposals', price: 75, unit: 'product', category: 'Google Docs Automations' },
    'sheets_custom_dash': { name: 'Sheets: Generate custom dashboards', price: 95, unit: 'product', category: 'Google Sheets Automations' },
    'project_workflow': { name: 'Bespoke Project: Workflow Transformation', price: 1200, unit: 'project', category: 'Bespoke Projects' },
    'addon_priority': { name: 'Add-On: Priority Setup (under 48 hours)', price: 20, unit: 'add-on', category: 'Add-Ons' },
    'addon_video': { name: 'Add-On: Personal walkthrough video', price: 30, unit: 'add-on', category: 'Add-Ons' }
};

export default function QuoteBuilderPage() {
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [selectedService, setSelectedService] = useState(Object.keys(servicePriceList)[0]);
    const [quantity, setQuantity] = useState(1);
    const [clientName, setClientName] = useState('');

    const addLineItem = () => {
        const service = servicePriceList[selectedService as keyof typeof servicePriceList];
        if (!service || quantity < 1) return;

        const newItem = {
            id: Date.now(),
            description: service.name,
            quantity: quantity,
            unitPrice: service.price,
            total: service.price * quantity,
        };
        setLineItems([...lineItems, newItem]);
    };

    const removeLineItem = (id: number) => {
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return lineItems.reduce((acc, item) => acc + item.total, 0).toFixed(2);
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor('#008080');
        doc.text("Quotation", 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text("Empower VA Services", 14, 32);
        doc.text("Your Professional Automation Partner", 14, 38);
        doc.text(`For: ${clientName || 'Valued Client'}`, 145, 32, { align: 'left' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 145, 38, { align: 'left' });

        autoTable(doc, {
            head: [["Description", "Quantity", "Unit Price", "Total"]],
            body: lineItems.map(item => [item.description, item.quantity, `£${item.unitPrice.toFixed(2)}`, `£${item.total.toFixed(2)}`]),
            startY: 55,
            theme: 'striped',
            headStyles: { fillColor: [0, 128, 128] },
        });

        const finalY = (doc as any).autoTable.previous.finalY;
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor('#008080');
        doc.text("Grand Total:", 130, finalY + 20);
        doc.setFontSize(20);
        doc.text(`£${calculateTotal()}`, 160, finalY + 20);
        
        doc.save(`Quote-EmpowerVA-${clientName || 'Client'}.pdf`);
    };

    const serviceCategories = Object.entries(servicePriceList).reduce((acc, [key, service]) => {
        const category = service.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push({ key, ...service });
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <Fragment>
            <div className="bg-white p-8 rounded-2xl shadow-2xl">
                <header className="text-center mb-10">
                    <h1 className="text-5xl font-extrabold text-gray-800">Quote Command</h1>
                    <p className="text-teal-600 font-semibold mt-2 text-lg">Build. Price. Impress.</p>
                </header>

                <div className="grid md:grid-cols-6 gap-6 mb-6 p-6 bg-gray-50 rounded-lg border">
                    <div className="md:col-span-6">
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Client Name</label>
                        <input type="text" id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., The Next Big Thing Ltd." />
                    </div>
                    <div className="md:col-span-3">
                        <label htmlFor="service" className="block text-sm font-medium text-gray-700">Select a Service</label>
                        <select id="service" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {Object.keys(serviceCategories).map(category => (
                                <optgroup label={category} key={category}>
                                    {serviceCategories[category].map(service => (
                                        <option key={service.key} value={service.key}>{service.name}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Qty</label>
                        <input type="number" id="quantity" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div className="md:col-span-2 flex items-end">
                        <button onClick={addLineItem} className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-lg hover:bg-teal-700 transition-all">
                            Add to Quote
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg">
                    <h2 className="text-3xl font-bold text-gray-700 mb-4">Proposal Details</h2>
                    {lineItems.length === 0 ? (
                        <p className="text-gray-500 italic text-center py-8">Your proposal is currently empty.</p>
                    ) : (
                        <div className="space-y-3">
                            {lineItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm border-l-4 border-teal-500">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.description}</p>
                                        <p className="text-sm text-gray-600">{item.quantity} x £{item.unitPrice.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <p className="font-semibold text-xl text-gray-800 mr-6">£{item.total.toFixed(2)}</p>
                                        <button onClick={() => removeLineItem(item.id)} className="text-red-400 hover:text-red-600 font-bold text-xl"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                            <div className="pt-6 mt-6 border-t-2 border-dashed flex justify-end">
                                <div className="text-right">
                                    <p className="text-gray-600 font-semibold uppercase tracking-wider">Grand Total</p>
                                    <p className="text-5xl font-extrabold text-teal-600">£{calculateTotal()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                {lineItems.length > 0 && (
                    <div className="mt-10 flex justify-center">
                        <button onClick={generatePDF} className="w-full max-w-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-lg shadow-xl hover:from-purple-700 hover:to-indigo-700 transition-all text-lg">
                            Download Professional PDF Quote
                        </button>
                    </div>
                )}
            </div>
        </Fragment>
    );
}
