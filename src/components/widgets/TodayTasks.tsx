'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { FaTasks } from 'react-icons/fa';

export default function TodayTasks() {
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            const { count, error } = await supabase
                .from('admin_tasks')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (!error) {
                setPendingCount(count || 0);
            }
            setLoading(false);
        };
        fetchTasks();
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
            <div className="flex items-center mb-4">
                <FaTasks className="w-6 h-6 text-violet-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-800">Pending Tasks</h3>
            </div>
            <div className="flex-grow flex items-center justify-center">
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                    <p className="text-5xl font-bold text-violet-600">{pendingCount}</p>
                )}
            </div>
            <Link href="/my-hub/tasks" className="mt-4 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors">
                View All Tasks
            </Link>
        </div>
    );
}