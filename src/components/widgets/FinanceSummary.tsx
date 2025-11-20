'use client';

import Link from 'next/link';
import { FaFileInvoiceDollar } from 'react-icons/fa';

export default function FinanceSummary() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
            <div className="flex items-center mb-4">
                <FaFileInvoiceDollar className="w-6 h-6 text-blue-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-800">Finances</h3>
            </div>
            <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-400">Coming Soon</p>
            </div>
            <Link href="/my-hub/finances" className="mt-4 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors">
                View Finances
            </Link>
        </div>
    );
}