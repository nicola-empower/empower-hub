// src/app/admin/timetracker/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaPlay, FaStop, FaTrash } from 'react-icons/fa';

// Define types for our data
type Client = {
    client_id: string;
    name: string;
    email: string;
};
type TimeLog = {
    id: number;
    task_description: string;
    start_time: string;
    end_time: string | null;
    is_running: boolean;
};

export default function TimeTrackerPage() {
    const { showToast, Toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [taskDescription, setTaskDescription] = useState('');
    const [runningTimer, setRunningTimer] = useState<TimeLog | null>(null);

    // Fetch clients on load
    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('client_id, name, email');

            if (error) {
                showToast('Could not fetch clients.', 'error');
                console.error("Error fetching clients:", error);
            } else {
                setClients(data as Client[]);
            }
        };
        fetchClients();
    }, []);

    // Fetch time logs when a client is selected
    useEffect(() => {
        if (!selectedClient) {
            setTimeLogs([]);
            setRunningTimer(null);
            return;
        }

        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('client_id', selectedClient)
                .order('start_time', { ascending: false });

            if (error) {
                showToast('Failed to fetch time logs.', 'error');
            } else {
                setTimeLogs(data as TimeLog[]);
                const running = data.find(log => log.is_running);
                setRunningTimer(running || null);
            }
        };
        fetchLogs();
    }, [selectedClient, showToast]);
    
    // Handler to start the timer
    const handleStartTimer = async () => {
        if (!selectedClient || !taskDescription) {
            showToast('Please select a client and enter a task description.', 'error');
            return;
        }
        if (runningTimer) {
            showToast('A timer is already running for this client.', 'error');
            return;
        }

        // --- NEW LOGIC: Automatically create a contract if one doesn't exist ---
        const { error: contractError } = await supabase
            .from('client_contracts')
            .upsert({ client_id: selectedClient, total_hours_contracted: 20 }, { onConflict: 'client_id' });

        if (contractError) {
            showToast('Could not create or verify client contract.', 'error');
            console.error('Contract upsert error:', contractError);
            return;
        }
        // --- END OF NEW LOGIC ---

        const { data, error } = await supabase
            .from('time_logs')
            .insert({
                client_id: selectedClient,
                task_description: taskDescription,
                start_time: new Date().toISOString(),
                is_running: true,
            })
            .select()
            .single();

        if (error) {
            showToast('Failed to start timer.', 'error');
        } else {
            setTimeLogs(prev => [data as TimeLog, ...prev]);
            setRunningTimer(data as TimeLog);
            setTaskDescription('');
            showToast('Timer started!', 'success');
        }
    };

    // Handler to stop the timer
    const handleStopTimer = async () => {
        if (!runningTimer) return;

        const { data, error } = await supabase
            .from('time_logs')
            .update({ end_time: new Date().toISOString(), is_running: false })
            .eq('id', runningTimer.id)
            .select()
            .single();
        
        if (error) {
            showToast('Failed to stop timer.', 'error');
        } else {
            setTimeLogs(prev => prev.map(log => log.id === runningTimer.id ? data as TimeLog : log));
            setRunningTimer(null);
            showToast('Timer stopped.', 'success');
        }
    };

    // Handler to delete a time log
    const handleDeleteLog = async (logId: number) => {
        const { error } = await supabase.from('time_logs').delete().match({ id: logId });
        if (error) {
            showToast('Failed to delete log.', 'error');
        } else {
            setTimeLogs(prev => prev.filter(log => log.id !== logId));
            showToast('Log deleted.', 'success');
        }
    };

    return (
        <Fragment>
            <Toast />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Time Tracker</h1>
                <p className="text-lg text-gray-600 mt-1">Track billable hours for your clients.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 space-y-8">
                {/* Timer Controls */}
                <div className="p-6 bg-gray-50 rounded-xl">
                    <h2 className="text-xl font-bold mb-4">Start New Timer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="p-3 border rounded-lg md:col-span-1"
                        >
                            <option value="">Select a Client</option>
                            {clients.map(client => (
                                <option key={client.client_id} value={client.client_id}>
                                    {client.name || client.email}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder="What are you working on?"
                            className="p-3 border rounded-lg md:col-span-2"
                        />
                    </div>
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={runningTimer ? handleStopTimer : handleStartTimer}
                            className={`px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg flex items-center gap-3 transition-colors ${
                                runningTimer ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                            }`}
                        >
                            {runningTimer ? <FaStop /> : <FaPlay />}
                            {runningTimer ? 'Stop Timer' : 'Start Timer'}
                        </button>
                    </div>
                </div>

                {/* Time Logs List */}
                <div>
                    <h2 className="text-xl font-bold mb-4">Time Entries</h2>
                    <ul className="space-y-3">
                        {timeLogs.map(log => (
                            <li key={log.id} className="flex items-center justify-between p-4 bg-white border rounded-lg">
                                <div>
                                    <p className="font-semibold">{log.task_description}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(log.start_time).toLocaleString()} - {log.end_time ? new Date(log.end_time).toLocaleString() : 'Running...'}
                                    </p>
                                </div>
                                <button onClick={() => handleDeleteLog(log.id)} className="text-gray-400 hover:text-red-500">
                                    <FaTrash />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Fragment>
    );
}
