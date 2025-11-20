'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';

// Define the type to match your 'admin_tasks' table structure
type AdminTask = {
    id: string; // Changed from number to string for UUID
    title: string;
    status: 'pending' | 'completed'; // Matches your 'status' column
    created_at: string;
    admin_id: string; // Matches your 'admin_id' column
};

export default function AdminTasksPage() {
    const { showToast, Toast } = useToast();
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [newTask, setNewTask] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch user-specific tasks from 'admin_tasks' table
    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_tasks') // CORRECTED: Use your 'admin_tasks' table
                .select('*')
                .order('created_at', { ascending: true });

            if (error) {
                showToast('Could not load your tasks.', 'error');
                console.error('Error fetching tasks:', error);
            } else {
                setTasks(data as AdminTask[]);
            }
            setLoading(false);
        };
        fetchTasks();
    }, []); // Empty dependency array prevents infinite loops

    // Handle adding a new task
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim() === '') return;

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            showToast('You must be logged in to add a task.', 'error');
            return;
        }

        // CORRECTED: Insert into 'admin_tasks' with 'admin_id' and a default 'status'
        const { data, error } = await supabase
            .from('admin_tasks')
            .insert({ title: newTask, admin_id: user.id, status: 'pending' })
            .select()
            .single();

        if (error) {
            showToast('Failed to add task.', 'error');
            console.error('Insert error:', error);
        } else {
            setTasks(prev => [...prev, data as AdminTask]);
            setNewTask('');
            showToast('Task added!', 'success');
        }
    };

    // Handle toggling the completion status of a task
    const handleToggleTask = async (task: AdminTask) => {
        const newStatus = task.status === 'pending' ? 'completed' : 'pending';
        const { error } = await supabase
            .from('admin_tasks')
            .update({ status: newStatus })
            .match({ id: task.id });

        if (error) {
            showToast('Failed to update task.', 'error');
        } else {
            setTasks(prev =>
                prev.map(t =>
                    t.id === task.id ? { ...t, status: newStatus } : t
                )
            );
        }
    };

    // Handle deleting a task
    const handleDeleteTask = async (taskId: string) => {
        // Optimistically update UI
        setTasks(prev => prev.filter(t => t.id !== taskId));

        const { error } = await supabase
            .from('admin_tasks')
            .delete()
            .match({ id: taskId });

        if (error) {
            showToast('Failed to delete task.', 'error');
            const failedTask = tasks.find(t => t.id === taskId);
            // --- FIX IS HERE: Changed setTodos to setTasks ---
            if (failedTask) setTasks(prev => [...prev, failedTask]);
        } else {
            showToast('Task deleted.', 'success');
        }
    };

    return (
        <Fragment>
            <Toast />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">My To-Do List</h1>
            </header>
            <div className="bg-white p-6 rounded-xl shadow-md">
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-2 mb-6">
                    <input
                        type="text"
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        placeholder="Add a new to-do item..."
                        className="flex-1 p-2 border rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Add
                    </button>
                </form>

                {loading ? (
                    <p>Loading your list...</p>
                ) : (
                    <ul className="space-y-3">
                        {tasks.map(task => (
                            <li
                                key={task.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'completed'}
                                        onChange={() => handleToggleTask(task)}
                                        className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                    />
                                    <span className={`ml-3 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {!loading && tasks.length === 0 && (
                    <p className="text-center text-gray-500">Your to-do list is empty. Add a task to get started!</p>
                )}
            </div>
        </Fragment>
    );
}