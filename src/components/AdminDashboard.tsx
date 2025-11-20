'use client'; // This is important for components with hooks in Next.js App Router

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import the Link component

// Icon components to keep the main return clean
const ProjectChart = () => (
    <svg viewBox="0 0 36 36" className="w-24 h-24">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3.8"/>
        {/* Teal part of the chart */}
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#2dd4bf" strokeWidth="3.8" strokeDasharray="60, 100"/>
        {/* Purple part of the chart */}
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#c084fc" strokeWidth="3.8" strokeDasharray="0, 60, 25, 15"/>
        <text x="18" y="20.35" className="text-[5px] fill-current text-gray-600 text-center" textAnchor="middle">35%</text>
    </svg>
);

const NotificationBell = () => (
    <div className="relative flex justify-center items-center h-32">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-8 right-12 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 text-white items-center justify-center text-xs font-bold">1</span>
        </span>
    </div>
);

// --- NEW CARD COMPONENTS ---

const AtAGlanceCard = () => (
    <div className="bg-teal-400/20 p-6 rounded-xl shadow-sm border border-teal-400/30">
        <h4 className="font-bold text-lg text-gray-700 mb-4">At a Glance</h4>
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Projects</span>
                <span className="font-bold text-gray-800 text-xl">5</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-600">Hours Logged (Week)</span>
                <span className="font-bold text-gray-800 text-xl">12.5</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Invoices</span>
                <span className="font-bold text-teal-600 text-xl">£450</span>
            </div>
        </div>
    </div>
);

const UpcomingDeadlinesCard = () => (
     <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30">
        <h4 className="font-bold text-lg text-gray-700 mb-4">Upcoming Deadlines</h4>
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <p className="text-gray-700">Draft blog post for Client X</p>
                <span className="text-sm font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-md">Tomorrow</span>
            </div>
            <div className="flex justify-between items-center">
                <p className="text-gray-700">Finalise social media schedule</p>
                <span className="text-sm font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-md">In 3 days</span>
            </div>
             <div className="flex justify-between items-center">
                <p className="text-gray-700">Invoice Client Y</p>
                <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-md">Next Week</span>
            </div>
        </div>
    </div>
);


// Main Admin Dashboard Component
const AdminDashboard = () => {
    // State to hold the current date and time string
    const [dateTime, setDateTime] = useState('');

    // useEffect hook to set up the date and time functionality
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            setDateTime(now.toLocaleDateString('en-GB', options));
        };
        updateDateTime();
        const timerId = setInterval(updateDateTime, 60000);
        return () => clearInterval(timerId);
    }, []);

    return (
        // This component now only returns the main content for the dashboard
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Welcome, Nicola!</h2>
                    <p className="text-gray-500">What's New</p>
                </div>
                <div className="text-right">
                    <h3 className="text-2xl font-bold text-purple-500">Admin Dashboard</h3>
                    <p className="text-gray-500">{dateTime}</p>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* My Hub Card */}
                <div className="bg-teal-400/20 p-6 rounded-xl shadow-sm border border-teal-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-2">My Hub</h4>
                    <p className="text-gray-600">Already created.. another dashboard.</p>
                </div>

                {/* Projects Card */}
                <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-4">Projects</h4>
                    <div className="flex justify-center items-center h-32">
                       <ProjectChart />
                    </div>
                </div>

                {/* Invoices Card */}
                <div className="bg-teal-400/20 p-6 rounded-xl shadow-sm border border-teal-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-4">Invoices</h4>
                    <div className="flex justify-center items-center h-32">
                        <img src="https://i.ibb.co/L5rK1gN/invoice-icon.png" alt="Invoice graphic" className="h-28" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/112x112/c084fc/ffffff?text=Invoice'; }} />
                    </div>
                </div>

                {/* Clients Card */}
                <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30 flex flex-col justify-between">
                    <div>
                       <h4 className="font-bold text-lg text-gray-700 mb-2">Clients</h4>
                       <p className="text-gray-600">Link to client info page.</p>
                    </div>
                    <Link href="/admin/clients" className="mt-4 text-purple-600 font-semibold hover:underline">Go to Client Hub →</Link>
                </div>

                {/* CRM Card */}
                <div className="bg-teal-400/20 p-6 rounded-xl shadow-sm border border-teal-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-2">CRM</h4>
                    <ul className="text-gray-600 space-y-1 list-disc list-inside">
                        <li>Address</li>
                        <li>Phone Number</li>
                        <li>Email</li>
                        <li>Etc client info</li>
                    </ul>
                </div>

                {/* My Pricing Card */}
                <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-2">My Pricing</h4>
                    <ul className="text-gray-600 space-y-1 list-disc list-inside">
                        <li>Easy invoice</li>
                        <li>Quick quote calculator</li>
                        <li>Just Eat style</li>
                    </ul>
                </div>
                
                {/* Unread Messages Card */}
                <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30">
                    <h4 className="font-bold text-lg text-gray-700 mb-4">Unread Messages</h4>
                    <NotificationBell />
                </div>

                {/* --- NEW CARDS ARE NOW IN PLACE --- */}
                <AtAGlanceCard />
                <UpcomingDeadlinesCard />

            </div>
        </div>
    );
};

export default AdminDashboard;
