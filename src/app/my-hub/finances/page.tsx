// src/app/my-hub/finances/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';

type Transaction = {
    id: string;
    transaction_date: string;
    description: string;
    type: 'income' | 'outgoing';
    amount: number;
};

export default function FinancesPage() {
    const { showToast, Toast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'income' | 'outgoing'>('income');

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('finances').select('*').order('transaction_date', { ascending: false });
            if (error) {
                showToast('Could not load transactions.', 'error');
            } else {
                setTransactions(data as Transaction[]);
            }
            setLoading(false);
        };
        fetchTransactions();
    }, []);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase.from('finances').insert({ description: desc, amount: parseFloat(amount), type }).select().single();
        if (error) {
            showToast('Failed to add transaction.', 'error');
        } else {
            setTransactions(prev => [data as Transaction, ...prev]);
            setDesc('');
            setAmount('');
            showToast('Transaction added!', 'success');
        }
    };

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalOutgoing = transactions.filter(t => t.type === 'outgoing').reduce((sum, t) => sum + t.amount, 0);

    return (
        <Fragment>
            <Toast />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Finances</h1>
            </header>
            <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="bg-green-100 p-6 rounded-xl text-green-800">
                    <p className="text-lg">Total Income</p>
                    <p className="text-3xl font-bold">£{totalIncome.toFixed(2)}</p>
                </div>
                <div className="bg-red-100 p-6 rounded-xl text-red-800">
                    <p className="text-lg">Total Outgoings</p>
                    <p className="text-3xl font-bold">£{totalOutgoing.toFixed(2)}</p>
                </div>
                 <div className="bg-blue-100 p-6 rounded-xl text-blue-800">
                    <p className="text-lg">Profit</p>
                    <p className="text-3xl font-bold">£{(totalIncome - totalOutgoing).toFixed(2)}</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Transactions</h3>
                    {/* Transaction list here */}
                </div>
                <div className="col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-bold mb-4">Add Transaction</h3>
                    <form onSubmit={handleAddTransaction} className="space-y-4">
                        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full p-2 border rounded-lg" required />
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (£)" className="w-full p-2 border rounded-lg" required />
                        <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 border rounded-lg">
                            <option value="income">Income</option>
                            <option value="outgoing">Outgoing</option>
                        </select>
                        <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-lg">Add</button>
                    </form>
                </div>
            </div>
        </Fragment>
    );
}
