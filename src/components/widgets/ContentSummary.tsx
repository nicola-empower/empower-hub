'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { FaCalendarAlt } from 'react-icons/fa';

export default function ContentSummary() {
    const [upcomingCount, setUpcomingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const { count, error } = await supabase
                .from('content_plans')
                .select('id', { count: 'exact', head: true })
                .gte('publish_date', today.toISOString().split('T')[0])
                .lte('publish_date', nextWeek.toISOString().split('T')[0]);

            if (!error) {
                setUpcomingCount(count || 0);
            }
            setLoading(false);
        };
        fetchContent();
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
            <div className="flex items-center mb-4">
                <FaCalendarAlt className="w-6 h-6 text-emerald-500 mr-3" />
                <h3 className="text-xl font-bold text-gray-800">Content This Week</h3>
            </div>
            <div className="flex-grow flex items-center justify-center">
                {loading ? (
                    <p className="text-gray-400">Loading...</p>
                ) : (
                     <p className="text-5xl font-bold text-emerald-600">{upcomingCount}</p>
                )}
            </div>
            <Link href="/my-hub/contentplan" className="mt-4 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors">
                View Content Planner
            </Link>
        </div>
    );
}