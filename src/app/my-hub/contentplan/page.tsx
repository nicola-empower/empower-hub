// src/app/admin/my-hub/contentplan/page.tsx
'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { motion, AnimatePresence } from 'framer-motion';

// Define the type for a content plan item
type ContentPlan = {
    id: number;
    title: string;
    type: string;
    publish_date: string; // This will be in 'YYYY-MM-DD' format
};

export default function ContentPlannerPage() {
    const { showToast, Toast } = useToast();
    const [content, setContent] = useState<ContentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [newContent, setNewContent] = useState({
        title: '',
        type: 'Social Media',
        date: ''
    });

    // Fetch content from Supabase when the component loads
    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('content_plans')
                .select('*')
                .order('publish_date', { ascending: true });

            if (error) {
                showToast('Could not load content plan.', 'error');
                console.error("Fetch error:", error);
            } else {
                setContent(data as ContentPlan[]);
            }
            setLoading(false);
        };
        fetchContent();
    }, []); // Empty array ensures this runs only once

    // Handler for form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewContent(prev => ({ ...prev, [name]: value }));
    };

    // Handler for adding a new content item to Supabase
    const handleAddContent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newContent.title || !newContent.date) {
            showToast('Title and date are required.', 'error');
            return;
        }

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            showToast('You must be logged in.', 'error');
            return;
        }

        const { data, error } = await supabase
            .from('content_plans')
            .insert({
                title: newContent.title,
                type: newContent.type,
                publish_date: newContent.date,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            showToast('Failed to add content.', 'error');
            console.error("Insert error:", error);
        } else {
            setContent(prev => [...prev, data as ContentPlan].sort((a, b) => new Date(a.publish_date).getTime() - new Date(b.publish_date).getTime()));
            setNewContent({ title: '', type: 'Social Media', date: '' });
            showToast('Content added!', 'success');
        }
    };

    // Handler for deleting a content item
    const handleDeleteContent = async (id: number) => {
        const originalContent = [...content];
        setContent(prev => prev.filter(item => item.id !== id));

        const { error } = await supabase
            .from('content_plans')
            .delete()
            .match({ id });

        if (error) {
            showToast('Failed to delete content.', 'error');
            console.error("Delete error:", error);
            setContent(originalContent); // Revert on failure
        } else {
            showToast('Content deleted.', 'success');
        }
    };

    // Group content by date for display
    const groupedContent = content.reduce((acc, item) => {
        const date = item.publish_date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {} as Record<string, ContentPlan[]>);

    const dates = Object.keys(groupedContent);
    const today = new Date().toISOString().split('T')[0];

    return (
        <Fragment>
            <Toast />
            <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
                <header className="mb-6 pb-4 border-b-2 border-emerald-500">
                    <h1 className="text-3xl md:text-4xl font-bold text-violet-600 mb-2">Empower Content Planner</h1>
                    <p className="text-gray-600">Plan and track your business's marketing content.</p>
                </header>

                <section className="mb-8 p-6 bg-violet-50 rounded-lg shadow-inner">
                    <h2 className="text-xl md:text-2xl font-semibold text-violet-600 mb-4">Add New Content Idea</h2>
                    <form onSubmit={handleAddContent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="col-span-1 md:col-span-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" id="title" name="title" value={newContent.title} onChange={handleInputChange} placeholder="e.g., New blog post" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                        </div>
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select id="type" name="type" value={newContent.type} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                <option>Social Media</option>
                                <option>Blog Post</option>
                                <option>Newsletter</option>
                                <option>Video</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Publish Date</label>
                            <input type="date" id="date" name="date" value={newContent.date} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                        </div>
                        <button type="submit" className="col-span-1 md:col-span-4 p-3 bg-emerald-500 text-white font-semibold rounded-md shadow-md hover:bg-emerald-600 transition-colors">Add Content</button>
                    </form>
                </section>

                <section>
                    <h2 className="text-xl md:text-2xl font-semibold text-violet-600 mb-4">Your Content Schedule</h2>
                    {loading && <p className="text-center p-6 text-gray-500">Loading schedule...</p>}
                    {!loading && dates.length === 0 && (
                        <div className="text-center p-6 text-gray-500 italic">No content planned yet! Add one above.</div>
                    )}
                    <AnimatePresence>
                        {dates.map(date => (
                            <motion.div
                                key={date}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mb-6 last:mb-0"
                            >
                                <h3 className="text-lg md:text-xl font-bold mb-2 p-2 bg-emerald-100 rounded-lg flex items-center justify-between">
                                    <span>{new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    {date === today && <span className="text-sm font-normal text-emerald-600 bg-emerald-200 px-2 py-1 rounded-full">Today</span>}
                                </h3>
                                <div className="space-y-3">
                                    {groupedContent[date].map(item => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                                            className="p-4 bg-white rounded-md shadow flex justify-between items-center border border-gray-200"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-800">{item.title}</div>
                                                <div className="text-sm text-gray-500">{item.type}</div>
                                            </div>
                                            <button onClick={() => handleDeleteContent(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-100">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </section>
            </div>
        </Fragment>
    );
}
