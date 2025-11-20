// src/app/nicola/journal/weekly/[week]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type Definitions ---
type WeeklyReviewData = {
  weigh_in: number | null;
  non_scale_victories: string;
  feeling_physical_mental: string;
  achievements: string;
  challenges: string;
  goals: string;
  notes: string;
};

// --- Main Weekly Review Page Component ---
export default function WeeklyReviewPage({ params }: { params: { week: string } }) {
  const router = useRouter();
  const { week: week_start_date } = params; // The week's start date from the URL
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [review, setReview] = useState<Partial<WeeklyReviewData>>({
    weigh_in: null,
    non_scale_victories: '',
    feeling_physical_mental: '',
    achievements: '',
    challenges: '',
    goals: '',
    notes: '',
  });

  // --- Data Fetching ---
  const fetchReview = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('weekly_reviews')
      .select('*')
      .eq('week_start_date', week_start_date)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'No rows found' error
      console.error('Error fetching weekly review:', error);
    }
    if (data) {
      setReview(data);
    }
    setLoading(false);
  }, [week_start_date]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setReview(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? null : Number(value)) : value }));
  };

  // --- Save to Database ---
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('weekly_reviews')
      .upsert({ ...review, week_start_date }, { onConflict: 'week_start_date' });

    if (error) {
      console.error('Error saving weekly review:', error);
      alert('Failed to save weekly review.');
    } else {
      router.push('/nicola/journal');
    }
    setIsSaving(false);
  };
  
  const weekEndDate = new Date(week_start_date);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  if (loading) {
    return <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#2e5568' }}><p className="text-white">Loading Review...</p></div>;
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8" style={{ backgroundColor: '#2e5568' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: '#7886c7' }}>Be Kind To Yourself</h1>
          <p className="text-xl font-medium" style={{ color: '#d1d5db' }}>
            Weekly Review for {new Date(week_start_date).toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })} - {weekEndDate.toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* --- Grid for Reflection Sections --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          <div className="bg-white/10 p-4 rounded-lg">
            <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>Achievements</label>
            <textarea name="achievements" value={review.achievements || ''} onChange={handleInputChange} rows={4} className="w-full bg-white/20 border-none rounded p-2 text-white" placeholder="What went well this week?" />
          </div>
          {/* Challenges */}
          <div className="bg-white/10 p-4 rounded-lg">
            <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>Challenges</label>
            <textarea name="challenges" value={review.challenges || ''} onChange={handleInputChange} rows={4} className="w-full bg-white/20 border-none rounded p-2 text-white" placeholder="What was difficult?" />
          </div>
          {/* Non-Scale Victories */}
          <div className="bg-white/10 p-4 rounded-lg">
            <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>Non-Scale Victories</label>
            <textarea name="non_scale_victories" value={review.non_scale_victories || ''} onChange={handleInputChange} rows={4} className="w-full bg-white/20 border-none rounded p-2 text-white" placeholder="Celebrate the small wins!" />
          </div>
          {/* How I'm Feeling */}
          <div className="bg-white/10 p-4 rounded-lg">
            <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>How am I feeling?</label>
            <textarea name="feeling_physical_mental" value={review.feeling_physical_mental || ''} onChange={handleInputChange} rows={4} className="w-full bg-white/20 border-none rounded p-2 text-white" placeholder="Physically and mentally..." />
          </div>
        </div>

        {/* --- Goals & Weigh-in --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-4 rounded-lg md:col-span-2">
                <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>Goals for Next Week</label>
                <textarea name="goals" value={review.goals || ''} onChange={handleInputChange} rows={3} className="w-full bg-white/20 border-none rounded p-2 text-white" />
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
                <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>Weigh-in</label>
                <input type="number" name="weigh_in" value={review.weigh_in || ''} onChange={handleInputChange} className="w-full bg-white/20 border-none rounded p-2 text-white" placeholder="kg" />
            </div>
        </div>

        {/* --- Notes --- */}
        <div className="bg-white/10 p-4 rounded-lg">
          <label className="block text-lg font-semibold mb-2" style={{ color: '#d1d5db' }}>General Notes</label>
          <textarea name="notes" value={review.notes || ''} onChange={handleInputChange} rows={4} className="w-full bg-white/20 border-none rounded p-2 text-white" />
        </div>
        
        {/* --- Save Button --- */}
        <div className="flex justify-end">
            <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 rounded-lg font-bold text-white transition-colors" style={{ backgroundColor: '#5a3b1e' }}>
                {isSaving ? 'Saving...' : 'Save Weekly Review'}
            </button>
        </div>
      </div>
    </div>
  );
}
