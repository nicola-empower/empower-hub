// src/app/nicola-hub/page.tsx
'use client';

import React from 'react';

export default function NicolaHubDashboard() {
    return (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-violet-600 mb-2">My Personal Hub Dashboard</h1>
            <p className="text-gray-600 mb-6">A space for your personal growth, self-reflection, and deliberate decision-making.</p>
            
            {/* Grid for personal widgets */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder widget for a future "Personal Habits Tracker" */}
                <div className="bg-emerald-50 rounded-xl shadow-inner p-6 border-l-4 border-emerald-500">
                    <h2 className="text-xl font-semibold text-emerald-600 mb-2">Habits Progress</h2>
                    <p className="text-gray-700">Keep track of your monthly reading, lunar journaling, and body-care routines.</p>
                </div>
                
                {/* Placeholder for the B.R.A.I.N. Decision-Maker widget */}
                <div className="bg-violet-50 rounded-xl shadow-inner p-6 border-l-4 border-violet-500">
                    <h2 className="text-xl font-semibold text-violet-600 mb-2">Recent Decisions</h2>
                    <p className="text-gray-700">Review your past B.R.A.I.N. analyses and decision-making history.</p>
                </div>

                {/* Placeholder for the Smart Summariser widget */}
                <div className="bg-emerald-50 rounded-xl shadow-inner p-6 border-l-4 border-emerald-500">
                    <h2 className="text-xl font-semibold text-emerald-600 mb-2">Knowledge Library</h2>
                    <p className="text-gray-700">Quickly access summaries of the books and articles you've processed.</p>
                </div>
            </div>
        </div>
    );
}
