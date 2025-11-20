"use client";

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - these are read from your .env.local file.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single Supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function App() {
  // State variables to manage the component's data and UI
  const [decision, setDecision] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // This function is called when the user submits the form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from reloading on form submission
    setIsLoading(true);
    setAnalysis('');
    setError('');

    // This is the detailed prompt we'll send to the Gemini API.
    const prompt = `
      You are an insightful and supportive business coach. Your task is to help a self-employed virtual assistant named Nicola analyze a business or personal decision. Use the B.R.A.I.N. framework to structure your response. Be clear, concise, and professional.

      Decision to analyze: ${decision}

      B - What are the Benefits of this?
      R - What are the Risks of this?
      A - Are there any Alternatives?
      I - What is your instinct telling you?
      N - What happens if you do nothing?

      Please provide a detailed response for each section of the framework.
    `;
    
    // API call to the Gemini API
    try {
      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };

      // *** THIS IS THE FIX ***
      // We now read the Gemini API key from your .env.local file.
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY;

      // Check if the API key exists
      if (!apiKey) {
        throw new Error("NEXT_PUBLIC_GEMINI_KEY is not set in your .env.local file.");
      }

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        // Log the response body for more detailed error info
        const errorBody = await response.json();
        console.error("API Error Response:", errorBody);
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const result = await response.json();

      // Extract the text from the API's response
      const analysisText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (analysisText) {
        setAnalysis(analysisText);
        // Once we have the analysis, save it to our Supabase table
        await saveToSupabase(decision, analysisText);
      } else {
        console.error("Invalid response structure from AI:", result);
        throw new Error('Failed to get a valid response from the AI.');
      }
    } catch (err) {
      console.error("AI API Error:", err);
      // Display the actual error message for easier debugging
      setError(err.message || "Something went wrong with the AI. Please try again.");
    } finally {
      setIsLoading(false); // Stop the loading indicator
    }
  };

  // This function saves the decision and the AI analysis to your Supabase table
  const saveToSupabase = async (userDecision, aiAnalysis) => {
    try {
      const { data, error } = await supabase
        .from('decisions')
        .insert([
          { decision_text: userDecision, analysis_text: aiAnalysis }
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
        setError("Failed to save your analysis to the database.");
      } else {
        console.log("Decision saved successfully!", data);
      }
    } catch (err) {
      console.error("Supabase call error:", err);
      setError("Failed to connect to the database.");
    }
  };

  // This is the JSX that defines what the component looks like on the page
  return (
    <div className="min-h-screen p-4 bg-gray-100 flex flex-col items-center font-sans md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 md:p-8">
        <header className="mb-6 pb-4 border-b-2 border-emerald-500">
          <h1 className="text-3xl md:text-4xl font-bold text-violet-700 mb-2">B.R.A.I.N. Decision-Maker</h1>
          <p className="text-gray-600">Get a clear perspective on your choices using the B.R.A.I.N. framework.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="decision" className="block text-sm font-medium text-gray-700 mb-1">
              What decision are you mulling over, Nicola?
            </label>
            <textarea
              id="decision"
              rows="4"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Should I launch a new web development service for small businesses?"
              required
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-6 bg-emerald-500 text-white font-semibold rounded-md shadow-md hover:bg-emerald-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Get B.R.A.I.N. Analysis'}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg shadow-sm">
            {error}
          </div>
        )}
        {analysis && (
          <div className="mt-8 p-6 bg-violet-50 rounded-lg shadow-inner">
            <h2 className="text-2xl font-semibold text-violet-700 mb-4">Your Analysis</h2>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
