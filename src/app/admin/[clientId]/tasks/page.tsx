// src/app/admin/tasks/page.tsx
'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useToast, InlineEdit } from '@/app/components/HelperComponents';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';

// --- Type Definitions ---
type Client = {
  client_id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  client_id: string;
  clients: { name: string }; // From the join query
};

const taskStatuses: Task['status'][] = ['pending', 'completed'];

// A new component to handle the logic, wrapped in Suspense
function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast, Toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  
  // Filter state
  const [filterClientId, setFilterClientId] = useState('');

  useEffect(() => {
    // Set initial filter from URL if present
    const clientIdFromUrl = searchParams.get('clientId');
    if (clientIdFromUrl) {
      setFilterClientId(clientIdFromUrl);
      setSelectedClient(clientIdFromUrl); // Pre-select for new tasks
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [tasksRes, clientsRes] = await Promise.all([
          supabase.from('tasks').select('*, clients(name)').order('created_at', { ascending: false }),
          supabase.from('clients').select('client_id, name').order('name')
        ]);

        if (tasksRes.error) throw tasksRes.error;
        if (clientsRes.error) throw clientsRes.error;

        setTasks(tasksRes.data as Task[]);
        setClients(clientsRes.data as Client[]);
      } catch (error: any) {
        showToast('Failed to load data: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [searchParams]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedClient) {
      showToast('Title and client are required.', 'error');
      return;
    }

    const { data: newTask, error } = await supabase
      .from('tasks')
      .insert({ title: newTaskTitle, client_id: selectedClient, status: 'pending' })
      .select('*, clients(name)')
      .single();

    if (error) {
      showToast('Failed to add task.', 'error');
    } else {
      setTasks(prev => [newTask as Task, ...prev]);
      setNewTaskTitle('');
      showToast('Task added!', 'success');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      showToast('Failed to delete task.', 'error');
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleUpdateTask = async (taskId: string, field: 'title' | 'status', value: string) => {
    const { error } = await supabase.from('tasks').update({ [field]: value }).eq('id', taskId);
    if (error) {
      showToast('Failed to update task.', 'error');
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    }
  };

  const filteredTasks = filterClientId ? tasks.filter(t => t.client_id === filterClientId) : tasks;

  return (
    <Fragment>
      <Toast />
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full">
          <FaArrowLeft />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Manage Client To-Do's</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">All Tasks</h3>
            <select value={filterClientId} onChange={e => setFilterClientId(e.target.value)} className="p-2 border rounded-lg">
              <option value="">Filter by Client...</option>
              {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
            </select>
          </div>
          {loading ? <p>Loading...</p> : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div key={task.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                  <div>
                    <InlineEdit value={task.title} onSave={(val) => handleUpdateTask(task.id, 'title', val)} ariaLabel="Edit task title" className="font-semibold" />
                    <p className="text-sm text-gray-500">For: {task.clients.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={task.status} onChange={e => handleUpdateTask(task.id, 'status', e.target.value)} className="text-xs p-1 border rounded-md">
                      {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-700 p-1"><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-bold mb-4">Add New Task</h3>
          <form onSubmit={handleAddTask} className="space-y-4">
            <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task Title" className="w-full p-2 border rounded-lg" required />
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="w-full p-2 border rounded-lg" required>
              <option value="">Assign to Client...</option>
              {clients.map(c => <option key={c.client_id} value={c.client_id}>{c.name}</option>)}
            </select>
            <button type="submit" className="w-full px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2">
              <FaPlus /> Add Task
            </button>
          </form>
        </div>
      </div>
    </Fragment>
  );
}

// Next.js requires a Suspense boundary for pages that use searchParams
export default function AdminTasksPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <TasksPageContent />
        </Suspense>
    );
}
