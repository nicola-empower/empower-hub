// src/app/nicola/journal/housework-tracker/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FaPlus, FaTrash, FaBroom } from 'react-icons/fa';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
type HouseworkTask = {
  id: number;
  task_name: string;
  is_completed: boolean;
  completion_date: string | null;
};

// --- Main Housework Tracker Page Component ---
export default function HouseworkTrackerPage() {
  const [tasks, setTasks] = useState<HouseworkTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('housework_tracker')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    };
    fetchTasks();
  }, []);

  // --- Form & Task Logic ---
  const handleAddTask = async () => {
    if (newTask.trim() === '') return;

    const { data, error } = await supabase
      .from('housework_tracker')
      .insert({ task_name: newTask, is_completed: false })
      .select()
      .single();

    if (error) {
      alert('Failed to add task.');
      console.error(error);
    } else if (data) {
      setTasks(prevTasks => [...prevTasks, data]);
      setNewTask('');
    }
  };

  const toggleTaskCompleted = async (task: HouseworkTask) => {
    const today = new Date().toISOString().slice(0,10);
    const newStatus = !task.is_completed;
    const newCompletionDate = newStatus ? today : null;

    const { error } = await supabase
      .from('housework_tracker')
      .update({ is_completed: newStatus, completion_date: newCompletionDate })
      .eq('id', task.id);

    if (error) {
      alert('Failed to update task.');
    } else {
      setTasks(prevTasks =>
        prevTasks.map(t => (t.id === task.id ? { ...t, is_completed: newStatus, completion_date: newCompletionDate } : t))
      );
    }
  };

  const handleDeleteTask = async (id: number) => {
    const { error } = await supabase
        .from('housework_tracker')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Failed to delete task.');
    } else {
        setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#7886c7' }}>Housework Tracker</h1>
          <p className="text-lg" style={{ color: '#d1d5db' }}>A tidy space for a tidy mind.</p>
        </div>

        {/* Add Task Input */}
        <div className="bg-white/10 p-4 rounded-lg flex gap-2 mb-6">
            <input 
                type="text" 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                className="flex-grow bg-white/20 border-none rounded p-3 text-white placeholder-gray-300" 
                placeholder="Add a new chore..."
            />
            <button onClick={handleAddTask} className="p-3 bg-pink-500 rounded text-white text-xl">
                <FaPlus />
            </button>
        </div>

        {/* Task List */}
        <div className="bg-white/10 p-4 rounded-lg">
            {loading ? <p className="text-center text-white">Loading tasks...</p> : (
                <ul className="space-y-3">
                    {tasks.map(task => (
                        <li key={task.id} className="flex items-center justify-between bg-white/5 p-3 rounded-md transition-all">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTaskCompleted(task)}>
                                <input 
                                    type="checkbox" 
                                    checked={task.is_completed} 
                                    readOnly
                                    className="h-6 w-6 rounded-md text-pink-500 focus:ring-0 bg-white/20 border-none"
                                />
                                <span className={`text-lg ${task.is_completed ? 'line-through text-gray-400' : 'text-white'}`}>
                                    {task.task_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                {task.is_completed && task.completion_date && (
                                    <span className="text-xs text-gray-400">
                                        Done: {new Date(task.completion_date).toLocaleDateString('en-GB')}
                                    </span>
                                )}
                                <button onClick={() => handleDeleteTask(task.id)} className="text-red-400 hover:text-red-600 p-2">
                                    <FaTrash />
                                </button>
                            </div>
                        </li>
                    ))}
                    {tasks.length === 0 && <p className="text-center text-gray-400">No chores listed yet. Add one to get started!</p>}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
}
