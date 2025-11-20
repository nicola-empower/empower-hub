// src/app/my-hub/planarchy/page.tsx
'use client';

import { useState, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { motion, AnimatePresence } from 'framer-motion';

// Define types for our data
type Milestone = {
    id: number;
    title: string;
    status: string;
};

type Project = {
    id: number;
    project_name: string;
    milestones: Milestone[];
};

export default function PlanarchyPage() {
    const { showToast, Toast } = useToast();
    const [projectGoal, setProjectGoal] = useState('');
    const [generatedProject, setGeneratedProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generatePlan = async () => {
        if (!projectGoal) {
            setError("Please enter a project goal first!");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedProject(null);

        const prompt = `You are an expert project manager. Your task is to break down a large project goal into a series of smaller, actionable milestones. The user will provide the project goal. Respond with ONLY a JSON object. The JSON object should have two keys: "project_name" (a concise, catchy name for the project based on the goal) and "milestones" (an array of strings, where each string is a single milestone). Do not include any other text or explanation.

        Project Goal: "${projectGoal}"`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
            }
        };
        
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_KEY || "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API error! status: ${response.status}`);
            }

            const result = await response.json();
            const rawJsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!rawJsonString) {
                throw new Error("The AI returned an empty response.");
            }

            const parsedData = JSON.parse(rawJsonString);
            
            // Save the generated plan to the new, independent tables
            await savePlanToDatabase(parsedData.project_name, parsedData.milestones);

        } catch (e: any) {
            console.error("Plan generation failed:", e);
            setError(`Failed to generate plan: ${e.message}. Please try again.`);
            setIsLoading(false);
        }
    };

    const savePlanToDatabase = async (projectName: string, milestones: string[]) => {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            setError("You must be logged in to save a plan.");
            setIsLoading(false);
            return;
        }

        // 1. Insert the project into 'planarchy_projects'
        const { data: projectData, error: projectError } = await supabase
            .from('planarchy_projects')
            .insert({ project_name: projectName, user_id: user.id })
            .select()
            .single();

        if (projectError) {
            throw new Error(`Failed to save project: ${projectError.message}`);
        }

        // 2. Prepare milestones with the new project ID
        const milestoneRecords = milestones.map(title => ({
            project_id: projectData.id,
            title: title,
            status: 'To Do'
        }));

        // 3. Insert all milestones into 'planarchy_milestones'
        const { data: milestoneData, error: milestoneError } = await supabase
            .from('planarchy_milestones')
            .insert(milestoneRecords)
            .select();

        if (milestoneError) {
            await supabase.from('planarchy_projects').delete().match({ id: projectData.id });
            throw new Error(`Failed to save milestones: ${milestoneError.message}`);
        }

        // Set state to display the newly created project
        setGeneratedProject({
            id: projectData.id,
            project_name: projectData.project_name,
            milestones: milestoneData as Milestone[]
        });
        
        showToast('Plan generated and saved!', 'success');
        setProjectGoal('');
        setIsLoading(false);
    };

    return (
        <Fragment>
            <Toast />
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Planarchy!</h1>
                <p className="text-lg text-gray-600 mt-1">Bringing order to your project chaos.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="mb-6">
                    <label htmlFor="projectGoal" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter Your Big Project Goal
                    </label>
                    <textarea
                        id="projectGoal"
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., 'Organize the annual client conference' or 'Launch a marketing campaign for the new product'"
                        value={projectGoal}
                        onChange={(e) => setProjectGoal(e.target.value)}
                    />
                </div>

                <div className="flex justify-center mb-6">
                    <button
                        onClick={generatePlan}
                        disabled={isLoading}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-bold shadow-lg transition-all duration-300 transform bg-purple-600 hover:bg-purple-700 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Generating Plan...' : 'Generate Plan'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                {generatedProject && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 pt-6 border-t border-gray-200"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Project: <span className="text-emerald-600">{generatedProject.project_name}</span>
                        </h2>
                        <ul className="space-y-3">
                            <AnimatePresence>
                                {generatedProject.milestones.map((milestone, index) => (
                                    <motion.li
                                        key={milestone.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                                        className="flex items-center p-3 bg-gray-50 rounded-lg"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 bg-purple-200 text-purple-700 font-bold text-xs rounded-full flex items-center justify-center mr-4">{index + 1}</span>
                                        <span className="text-gray-700">{milestone.title}</span>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </ul>
                    </motion.div>
                )}
            </div>
        </Fragment>
    );
}
