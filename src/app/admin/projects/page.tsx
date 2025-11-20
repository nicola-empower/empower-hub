'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import KanbanBoard from '@/components/KanbanBoard'

// --- Type Definitions ---
type Milestone = { 
  id: string; 
  title: string;
  project_id: string; 
  status: 'Pending' | 'In Progress' | 'Completed'; 
  start_date: string | null;
  due_date: string | null;
};

type Project = { 
  id: string; 
  name: string; 
  client_id: string;
  client_name?: string; 
  status: string; 
  milestones: Milestone[];
};

type Client = {
  client_id: string;
  name: string;
};

// --- Icon Components ---
const AddIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'add'>('list');
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [formMilestones, setFormMilestones] = useState<{title: string, description: string}[]>([{ title: '', description: '' }]);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);

            const [projectsResponse, clientsResponse, milestonesResponse] = await Promise.all([
                supabase.from('projects').select('*').order('created_at', { ascending: false }),
                supabase.from('clients').select('*'),
                supabase.from('project_milestones').select('*')
            ]);

            if (projectsResponse.error || clientsResponse.error || milestonesResponse.error) {
                console.error("Supabase Error:", projectsResponse.error || clientsResponse.error || milestonesResponse.error);
                setLoading(false);
                return;
            }
            
            const projectsData: any[] = projectsResponse.data || [];
            const clientsData: Client[] = clientsResponse.data || [];
            const milestonesData: Milestone[] = milestonesResponse.data || [];

            const clientMap = new Map(clientsData.map(c => [c.client_id, c.name]));

            const formattedProjects = projectsData.map(project => {
                return {
                    ...project,
                    client_name: clientMap.get(project.client_id) || 'Unknown Client',
                    milestones: milestonesData.filter(milestone => milestone.project_id === project.id)
                };
            });

            setProjects(formattedProjects as Project[]);
            setClients(clientsData);
            setLoading(false);
        };
        fetchInitialData();
    }, []);
    
    const handleMilestoneChange = (index: number, field: 'title' | 'description', value: string) => {
        const updatedMilestones = [...formMilestones];
        updatedMilestones[index][field] = value;
        setFormMilestones(updatedMilestones);
    };
    const addMilestoneField = () => setFormMilestones([...formMilestones, { title: '', description: '' }]);
    const removeMilestoneField = (index: number) => setFormMilestones(formMilestones.filter((_, i) => i !== index));

    const handleNewProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);
        if (!newProjectName || !selectedClientId || formMilestones.some(m => !m.title)) {
            setMessage({ text: 'Please fill out project name, client, and all milestone titles.', type: 'error' });
            setSubmitting(false);
            return;
        }
        try {
            const { data: projectData, error: projectError } = await supabase.from('projects').insert([{ name: newProjectName, client_id: selectedClientId, status: 'Active' }]).select().single();
            if (projectError) throw projectError;
            
            const newProjectId = projectData.id;
            const milestonesToInsert = formMilestones.map((milestone, index) => ({ ...milestone, project_id: newProjectId, status: 'Pending', sort_order: index + 1 }));
            const { error: milestonesError } = await supabase.from('project_milestones').insert(milestonesToInsert);
            if (milestonesError) throw new Error(`Project created, but failed to add milestones: ${milestonesError.message}`);
            
            const newProjectForUI: Project = { ...projectData, client_name: clients.find(c => c.client_id === selectedClientId)?.name || 'Unknown Client', milestones: milestonesToInsert as Milestone[] };
            setProjects(prevProjects => [newProjectForUI, ...prevProjects]);
            
            setView('list');
            setMessage({ text: 'Project and milestones successfully created!', type: 'success' });
        } catch (err: any) {
            setMessage({ text: `Error: ${err.message}`, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };
    
    const activeProjectsCount = projects.filter(p => p.status?.toLowerCase() === 'active').length;
    
    if (loading) { return <div className="p-8 text-center text-gray-500">Loading...</div>; }

    return (
        <div className="p-8">
            {message && view === 'list' && <p className={`mb-4 text-center p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.text}</p>}
            
            {view === 'add' ? (
                <div>
                    <div className="flex items-center mb-8">
                        <button onClick={() => { setView('list'); setMessage(null); }} className="mr-4 p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"><BackIcon /></button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Create New Project</h1>
                            <p className="text-gray-500 mt-1">Define the project and its initial milestones.</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
                        <form onSubmit={handleNewProjectSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                                    <input type="text" id="projectName" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300" required />
                                </div>
                                <div>
                                    <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">Assign to Client</label>
                                    <select id="client" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white" required>
                                        <option value="" disabled>Select a client...</option>
                                        {clients.map(client => <option key={client.client_id} value={client.client_id}>{client.name}</option>)}
                                    </select>
                                </div>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Project Milestones</h3>
                                <div className="space-y-4">
                                    {formMilestones.map((milestone, index) => (
                                        <div key={index} className="flex items-start gap-4">
                                            <span className="text-gray-500 font-semibold pt-2">{index + 1}.</span>
                                            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                                                    <input type="text" value={milestone.title} onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" required/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description (Optional)</label>
                                                    <input type="text" value={milestone.description} onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300"/>
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeMilestoneField(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full mt-6" disabled={formMilestones.length <= 1}><TrashIcon /></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addMilestoneField} className="mt-4 px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-100 hover:bg-teal-200 rounded-lg flex items-center gap-2"><AddIcon/> Add Another Milestone</button>
                            </div>
                            <div className="flex gap-4 pt-4 border-t"><button type="button" onClick={() => setView('list')} className="flex-1 px-6 py-3 text-gray-700 font-semibold bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button><button type="submit" disabled={submitting} className="flex-1 px-6 py-3 text-white font-semibold bg-teal-500 hover:bg-teal-600 rounded-lg shadow-md disabled:opacity-50">{submitting ? 'Creating...' : 'Create Project'}</button></div>
                        </form>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                            <p className="text-gray-500 mt-1">Track and manage all your ongoing and completed projects.</p>
                        </div>
                        <button onClick={() => setView('add')} className="px-5 py-2.5 text-white font-semibold rounded-lg bg-teal-500 hover:bg-teal-600 shadow-md flex items-center gap-2">
                            <AddIcon /> Create New Project
                        </button>
                    </div>
                    <div className="mb-8">
                        <div className="bg-purple-400/20 p-6 rounded-xl shadow-sm border border-purple-400/30">
                            <h4 className="font-bold text-lg text-gray-700 mb-2">Active Projects</h4>
                            <p className="text-5xl font-bold text-purple-600">{activeProjectsCount}</p>
                        </div>
                    </div>
                    <KanbanBoard projects={projects} />
                </>
            )}
        </div>
    );
}