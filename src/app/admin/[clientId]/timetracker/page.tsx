// src/app/admin/[clientId]/timetracker/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';

// Define types
type TimeLog = {
    start_time: string;
    end_time: string | null;
};

type Contract = {
    total_hours_contracted: number;
};

// Helper to calculate time difference in hours
const calculateHours = (start: string, end: string | null): number => {
    if (!end) return 0;
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    return (endTime - startTime) / (1000 * 60 * 60);
};

export default function ClientTimeTrackerPage() {
    const params = useParams();
    const clientId = params.clientId as string;

    const [totalHoursUsed, setTotalHoursUsed] = useState(0);
    const [contract, setContract] = useState<Contract | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!clientId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            // 1. Fetch the client's contract details
            const { data: contractData, error: contractError } = await supabase
                .from('client_contracts')
                .select('total_hours_contracted')
                .eq('client_id', clientId)
                .single();

            if (contractError || !contractData) {
                // If no contract, we can stop here. The page will show nothing.
                setLoading(false);
                return;
            }
            setContract(contractData);

            // 2. Fetch all completed time logs for this client
            const { data: logsData, error: logsError } = await supabase
                .from('time_logs')
                .select('start_time, end_time')
                .eq('client_id', clientId)
                .not('end_time', 'is', null);

            if (logsError) {
                setError('Could not load time tracking data.');
            } else {
                const totalHours = logsData.reduce((acc, log) => acc + calculateHours(log.start_time, log.end_time), 0);
                setTotalHoursUsed(totalHours);
            }
            setLoading(false);
        };

        fetchData();
    }, [clientId]);

    // If loading, or if no contract exists, don't render the main component
    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    if (!contract) {
        return (
            <div className="text-center p-10">
                <h1 className="text-xl text-gray-600">Time tracking is not enabled for this account.</h1>
            </div>
        );
    }

    const hoursRemaining = contract.total_hours_contracted - totalHoursUsed;
    const percentageUsed = (totalHoursUsed / contract.total_hours_contracted) * 100;

    return (
        <Fragment>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Your Time Report</h1>
                <p className="text-lg text-gray-600 mt-1">An overview of your contracted hours.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h2 className="text-xl font-bold text-gray-800">Time Usage</h2>
                                <p className="font-mono text-lg">
                                    <span className="font-bold text-purple-600">{totalHoursUsed.toFixed(2)}</span>
                                    <span className="text-gray-500"> / {contract.total_hours_contracted} hours used</span>
                                </p>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className="text-center pt-4">
                            <p className="text-5xl font-bold text-gray-800">{hoursRemaining.toFixed(2)}</p>
                            <p className="text-lg text-gray-500">Hours Remaining</p>
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    );
}
