// src/app/dashboard/tasks/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

// --- Type Definitions ---
type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
};

// --- Main Tasks Page Component ---
export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, Toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('client_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        showToast('Could not fetch tasks.', 'error');
      } else {
        setTasks(data as Task[]);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: Task['status']) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    
    // Optimistically update the UI
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      // Revert on error
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: currentStatus } : task
      ));
      showToast('Failed to update task.', 'error');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading tasks...</div>;
  }

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your To-Do List</h1>
        <p className="text-lg text-gray-600 mt-1">Here are the items we need from you to keep things moving.</p>
      </header>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="mx-auto text-5xl text-gray-300 mb-4" />
              <h4 className="text-xl font-medium text-gray-900">All Caught Up!</h4>
              <p className="text-gray-500">You have no pending tasks.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id, task.status)}
                className="border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:bg-purple-50 cursor-pointer transition-all"
              >
                <div>
                  {task.status === 'completed' ? (
                    <FaCheckCircle className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <FaCircle className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <p className={`text-lg font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {task.title}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </Fragment>
  );
}
