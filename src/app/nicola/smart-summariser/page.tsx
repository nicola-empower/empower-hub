"use client";
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
// IMPORT the server action we just created
import { getGeminiSummary } from './actions'; 

// Supabase Config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function SmartSummariser() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // To show "Saved!" message

  const handleSummarize = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSummary(null);
    setError(null);
    setSaveStatus(null);

    try {
      // 1. Get the summary securely from the Server Action
      const aiSummary = await getGeminiSummary(inputText);

      if (aiSummary) {
        setSummary(aiSummary);
        
        // 2. Save to Supabase (Client-side, using your RLS rules)
        await saveToSupabase(inputText, aiSummary);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToSupabase = async (original, result) => {
    try {
      const { error } = await supabase
        .from('knowledge_hub')
        .insert([
          { 
            original_text: original, 
            summary_text: result, 
            created_at: new Date().toISOString() 
          }
        ]);

      if (error) {
        console.error("Supabase Error:", error);
        setSaveStatus("Summary generated, but failed to save to history.");
      } else {
        setSaveStatus("Saved to Knowledge Hub!");
      }
    } catch (err) {
      console.error("Database connection error:", err);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100 flex flex-col items-center font-sans md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8">
        
        {/* Header */}
        <header className="mb-6 pb-4 border-b-2 border-emerald-500">
          <h1 className="text-3xl md:text-4xl font-bold text-violet-600 mb-2">
            Smart Summariser
          </h1>
          <p className="text-gray-600">
            Turn long articles and notes into concise summaries.
          </p>
        </header>

        {/* Input Form */}
        <form onSubmit={handleSummarize} className="space-y-4">
          <div>
            <label htmlFor="inputText" className="block text-sm font-medium text-gray-700 mb-1">
              Paste your text here
            </label>
            <textarea
              id="inputText"
              rows="10"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
              placeholder="Paste your text here (articles, emails, notes)..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-6 font-semibold rounded-md shadow-md transition-colors text-white
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600'}`}
          >
            {isLoading ? 'Analyzing...' : 'Generate Summary'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success / Save Status */}
        {saveStatus && !error && (
          <div className="mt-4 text-sm text-emerald-600 font-medium text-center">
            {saveStatus}
          </div>
        )}

        {/* Summary Result */}
        {summary && (
          <div className="mt-8 p-6 bg-violet-50 rounded-lg border border-violet-100 shadow-inner animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-semibold text-violet-600 mb-4 flex items-center gap-2">
              <span>✨</span> Summary
            </h2>
            <div className="prose prose-violet max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}