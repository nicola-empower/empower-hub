// src/app/nicola/journal/[date]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { FaHeart, FaRegSmile, FaRegMeh, FaRegFrown, FaRegTired, FaRegAngry, FaGlassWhiskey, FaPlus, FaTrash } from 'react-icons/fa';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
type Mood = 'Happy' | 'Okay' | 'Sad' | 'Tired' | 'Angry' | '';
type TodoItem = {
  id: number;
  task: string;
  completed: boolean;
};
type DailyEntryData = {
  mood: Mood;
  food_breakfast: string;
  calories_breakfast: number | null;
  food_lunch: string;
  calories_lunch: number | null;
  food_dinner: string;
  calories_dinner: number | null;
  food_snacks: string;
  calories_snacks: number | null;
  water_intake: number;
  sleep_hours: number | null;
  sleep_minutes: number | null;
  exercise_details: string;
  gratitude: string;
  journal_entry: string;
  period_tracker: boolean;
  todo_later: TodoItem[];
};

// --- Main Daily Entry Page Component ---
export default function DailyEntryPage({ params }: { params: { date: string } }) {
  const router = useRouter();
  const { date } = params;
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [entry, setEntry] = useState<Partial<DailyEntryData>>({
    mood: '',
    food_breakfast: '', calories_breakfast: null,
    food_lunch: '', calories_lunch: null,
    food_dinner: '', calories_dinner: null,
    food_snacks: '', calories_snacks: null,
    water_intake: 0,
    sleep_hours: null, sleep_minutes: null,
    exercise_details: '',
    gratitude: '',
    journal_entry: '',
    period_tracker: false,
    todo_later: [],
  });

  // --- Data Fetching ---
  const fetchEntry = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching entry:', error);
    }
    if (data) {
      // Ensure todo_later is an array, even if null in DB
      setEntry({ ...data, todo_later: data.todo_later || [] });
    }
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setEntry(prev => ({ ...prev, [name]: isNumber ? (value === '' ? null : Number(value)) : value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEntry(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const setMood = (newMood: Mood) => setEntry(prev => ({ ...prev, mood: newMood }));
  const setWater = (amount: number) => setEntry(prev => ({ ...prev, water_intake: amount }));

  // --- To-Do List Logic ---
  const handleAddTodo = () => {
    if (newTodo.trim() === '') return;
    const newTodoList = [...(entry.todo_later || []), { id: Date.now(), task: newTodo, completed: false }];
    setEntry(prev => ({ ...prev, todo_later: newTodoList }));
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    const newTodoList = (entry.todo_later || []).map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setEntry(prev => ({ ...prev, todo_later: newTodoList }));
  };

  const removeTodo = (id: number) => {
    const newTodoList = (entry.todo_later || []).filter(todo => todo.id !== id);
    setEntry(prev => ({ ...prev, todo_later: newTodoList }));
  };

  // --- Save to Database ---
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('daily_entries')
      .upsert({ ...entry, entry_date: date }, { onConflict: 'entry_date' });

    if (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry.');
    } else {
      router.push('/nicola/journal');
    }
    setIsSaving(false);
  };
  
  const moodOptions: { name: Mood; icon: React.ElementType }[] = [
      { name: 'Happy', icon: FaRegSmile }, { name: 'Okay', icon: FaRegMeh },
      { name: 'Sad', icon: FaRegFrown }, { name: 'Tired', icon: FaRegTired },
      { name: 'Angry', icon: FaRegAngry },
  ];

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#2e5568' }}><p className="text-white">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#7886c7' }}>One Day She Woke Up Different</h1>
          <p className="text-xl font-medium" style={{ color: '#d1d5db' }}>{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Mood Tracker */}
        <div className="bg-white/10 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3" style={{ color: '#7886c7' }}>How are you feeling?</h2>
          <div className="flex justify-around">
            {moodOptions.map(({ name, icon: Icon }) => (
              <button key={name} onClick={() => setMood(name)} className={`p-3 rounded-full transition-transform duration-200 ${entry.mood === name ? 'bg-pink-500 scale-110' : 'bg-white/20'}`}>
                <Icon className="w-8 h-8 text-white" />
              </button>
            ))}
          </div>
        </div>

        {/* Nutrition Tracker */}
        <div className="bg-white/10 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
            {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                <div key={meal}>
                    <label className="capitalize block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>{meal}</label>
                    <input type="text" name={`food_${meal}`} value={entry[`food_${meal}`] || ''} onChange={handleInputChange} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="What did you eat?"/>
                    <input type="number" name={`calories_${meal}`} value={entry[`calories_${meal}`] || ''} onChange={handleInputChange} className="w-full mt-2 bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="Calories (optional)"/>
                </div>
            ))}
        </div>

        {/* --- NEW: Water and Sleep Trackers --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3" style={{ color: '#7886c7' }}>Water Intake</h2>
                <div className="flex items-center justify-center space-x-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <button key={i} onClick={() => setWater(i + 1)}>
                            <FaGlassWhiskey className={`w-8 h-8 transition-colors ${i < (entry.water_intake || 0) ? 'text-blue-400' : 'text-white/30'}`} />
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-3" style={{ color: '#7886c7' }}>Sleep</h2>
                <div className="flex items-center space-x-4">
                    <input type="number" name="sleep_hours" value={entry.sleep_hours || ''} onChange={handleInputChange} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="Hours"/>
                    <input type="number" name="sleep_minutes" value={entry.sleep_minutes || ''} onChange={handleInputChange} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="Mins"/>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>Exercise</label>
                <textarea name="exercise_details" value={entry.exercise_details || ''} onChange={handleInputChange} rows={3} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" />
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
                <label className="block text-sm font-medium mb-1" style={{ color: '#d1d5db' }}>What I love about today</label>
                <textarea name="gratitude" value={entry.gratitude || ''} onChange={handleInputChange} rows={3} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" />
            </div>
        </div>

        {/* --- NEW: To Do Later --- */}
        <div className="bg-white/10 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#7886c7' }}>To Do Later</h2>
            <div className="flex gap-2 mb-4">
                <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()} className="flex-grow bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="Add a new task..."/>
                <button onClick={handleAddTodo} className="p-2 bg-pink-500 rounded text-white"><FaPlus /></button>
            </div>
            <ul className="space-y-2">
                {(entry.todo_later || []).map(todo => (
                    <li key={todo.id} className="flex items-center justify-between bg-white/5 p-2 rounded">
                        <span onClick={() => toggleTodo(todo.id)} className={`cursor-pointer ${todo.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                            {todo.task}
                        </span>
                        <button onClick={() => removeTodo(todo.id)} className="text-red-400 hover:text-red-600"><FaTrash /></button>
                    </li>
                ))}
            </ul>
        </div>
        
        <div className="bg-white/10 p-4 rounded-lg">
          <label className="block text-lg font-semibold mb-2" style={{ color: '#7886c7' }}>Brain Farts</label>
          <textarea name="journal_entry" value={entry.journal_entry || ''} onChange={handleInputChange} rows={8} className="w-full bg-white/20 border-none rounded p-2 text-white placeholder-gray-300" placeholder="Get it all out..."/>
        </div>

        <div className="flex justify-between items-center gap-6">
            <div className="bg-white/10 p-4 rounded-lg flex items-center gap-4">
                <input type="checkbox" id="period_tracker" name="period_tracker" checked={entry.period_tracker || false} onChange={handleCheckboxChange} className="h-6 w-6 rounded text-pink-500 focus:ring-pink-500" />
                <label htmlFor="period_tracker" className="text-sm font-medium" style={{ color: '#d1d5db' }}>Period Tracker</label>
            </div>
            <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 rounded-lg font-bold text-white transition-colors" style={{ backgroundColor: '#7886c7' }}>
                {isSaving ? 'Saving...' : 'Save & Close'}
            </button>
        </div>
      </div>
    </div>
  );
}
