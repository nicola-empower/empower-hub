// src/app/nicola/journal/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { FaHeart, FaRegSmile, FaRegMeh, FaRegFrown, FaRegTired, FaRegAngry } from 'react-icons/fa';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
type Mood = 'Happy' | 'Okay' | 'Sad' | 'Tired' | 'Angry' | string;

type DailyEntry = {
  entry_date: string;
  mood?: Mood;
  period_tracker?: boolean;
};

// --- Helper Components ---
const MoodIcon = ({ mood }: { mood: Mood }) => {
  const style = { color: '#7886c7', width: '16px', height: '16px' };
  switch (mood) {
    case 'Happy': return <FaRegSmile style={style} title="Happy" />;
    case 'Okay': return <FaRegMeh style={style} title="Okay" />;
    case 'Sad': return <FaRegFrown style={style} title="Sad" />;
    case 'Tired': return <FaRegTired style={style} title="Tired" />;
    case 'Angry': return <FaRegAngry style={style} title="Angry" />;
    default: return null;
  }
};

// --- Main Journal Page Component ---
export default function JournalPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
      const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('daily_entries')
        .select('entry_date, mood, period_tracker')
        .gte('entry_date', firstDay)
        .lte('entry_date', lastDay);

      if (error) {
        console.error('Error fetching journal entries:', error);
        setEntries([]);
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [currentDate, year, month]);


  // --- Calendar Logic ---
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goToPreviousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  
  const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  };

  const weekStartDate = getWeekStartDate(currentDate);

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold" style={{ color: '#7886c7' }}>My Journal</h1>
          <p className="text-lg" style={{ color: '#d1d5db' }}>A space for reflection and growth.</p>
        </div>

        <div className="text-center mb-8">
            <Link href={`/nicola/journal/weekly/${weekStartDate}`}>
                <button className="px-6 py-2 rounded-lg font-semibold text-white transition-colors" style={{ backgroundColor: '#7886c7' }}>
                    Go to Weekly Review
                </button>
            </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={goToPreviousMonth} className="p-2 rounded-full" style={{ backgroundColor: '#7886c7', color: '#ffffff' }} aria-label="Previous month">
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-semibold text-white">{monthNames[month]} {year}</h2>
            <button onClick={goToNextMonth} className="p-2 rounded-full" style={{ backgroundColor: '#7886c7', color: '#ffffff' }} aria-label="Next month">
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center font-medium" style={{ color: '#7886c7' }}>{day}</div>
            ))}

            {Array.from({ length: firstDayOfMonth }).map((_, index) => <div key={`blank-${index}`} />)}

            {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
              const dayNumber = dayIndex + 1;
              const dayDate = new Date(year, month, dayNumber);
              const dateString = dayDate.toISOString().slice(0, 10);
              const isToday = new Date().toDateString() === dayDate.toDateString();
              
              const entry = entries.find(e => e.entry_date === dateString);

              return (
                <Link href={`/nicola/journal/${dateString}`} key={dateString}>
                  <div
                    className={`relative aspect-square p-2 border rounded-lg flex flex-col justify-between cursor-pointer transition-all hover:border-pink-400 ${
                      isToday ? 'border-pink-400' : 'border-white/20'
                    }`}
                    style={{ backgroundColor: isToday ? '#7886c7' : 'transparent', color: '#ffffff' }}
                  >
                    <span className="font-bold">{dayNumber}</span>
                    <div className="absolute bottom-1 right-1 flex items-center space-x-1">
                      {entry?.mood && <MoodIcon mood={entry.mood} />}
                      {entry?.period_tracker && <FaHeart style={{ color: '#e11d48' }} title="Period" />}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
