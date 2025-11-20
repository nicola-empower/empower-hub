// src/app/admin/[clientId]/projects/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast, InlineEdit } from '@/app/components/HelperComponents';
import { CircularProgressBar } from '@/app/components/CircularProgressBar';
import { FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';

// --- Type Definitions ---
type Project = { id: string; name: string; status: string; };
type Milestone = { id: string; project_id: string; title: string; description: string | null; status: 'To Do' | 'In Progress' | 'Completed'; sort_order: number; };

const milestoneStatuses: Milestone['status'][] = ['To Do', 'In Progress', 'Completed'];

export default function AdminClientProjectsPage() {
    const { clientId } = useParams<{ clientId: string }>();
    const router = useRouter();
    const { showToast, Toast } = useToast();

    const [projects, setProjects] = useState<Project[]>([]);
    const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
    const [loading, setLoading] = useState(true);
    
    // Form state
    const [newProjectName, setNewProjectName] = useState('');
    const [newMilestoneInputs, setNewMilestoneInputs] = useState<Record<string, { title: string; description: string }>>({});
    
    useEffect(() => {
        const fetchData = async () => {
            if(!clientId) return;
            setLoading(true);
            try {
                const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
                if (projectsError) throw projectsError;
                
                setProjects(projectsData);
                
                const milestoneMap: Record<string, Milestone[]> = {};
                const milestoneInputMap: Record<string, { title: string, description: string}> = {};
                for (const p of projectsData) {
                    const { data: msData } = await supabase.from('project_milestones').select('*').eq('project_id', p.id).order('sort_order', { ascending: true });
                    milestoneMap[p.id] = msData || [];
                    milestoneInputMap[p.id] = { title: '', description: '' };
                }
                setMilestones(milestoneMap);
                setNewMilestoneInputs(milestoneInputMap);
            } catch (error: any) {
                showToast('Failed to load project data: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [clientId]);

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        const { data, error } = await supabase.from('projects').insert({ name: newProjectName, client_id: clientId, status: 'Active' }).select().single();
        if (error) {
            showToast('Failed to add project', 'error');
        } else {
            setProjects(prev => [data, ...prev]);
            setNewMilestoneInputs(prev => ({ ...prev, [data.id]: { title: '', description: '' } }));
            setNewProjectName('');
            showToast('Project added!', 'success');
        }
    };
    
    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm('Delete this project and ALL its milestones?')) return;
        await supabase.from('project_milestones').delete().eq('project_id', projectId);
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if(error) {
            showToast('Error deleting project', 'error');
        } else {
            setProjects(projects.filter(p => p.id !== projectId));
            showToast('Project deleted', 'success');
        }
    };

    // --- UPDATED FUNCTION TO USE EDGE FUNCTION ---
    const handleAddMilestone = async (projectId: string) => {
        const { title, description } = newMilestoneInputs[projectId];
        if (!title.trim()) return;
        
        try {
            const { data, error } = await supabase.functions.invoke('create-milestone', {
                body: { project_id: projectId, title, description },
            });

            if (error) throw error;

            const { newMilestone } = data;
            setMilestones(prev => ({...prev, [projectId]: [...(prev[projectId] || []), newMilestone]}));
            setNewMilestoneInputs(prev => ({...prev, [projectId]: {title: '', description: ''}}));
            showToast('Milestone Added', 'success');
        } catch (error: any) {
            console.error("Function error:", error);
            showToast(`Failed to add milestone: ${error.message}`, 'error');
        }
    };

    const handleUpdateMilestone = async (projectId: string, milestoneId: string, field: 'title' | 'description', value: string) => {
        const { error } = await supabase.from('project_milestones').update({ [field]: value }).eq('id', milestoneId);
        if(error) {
            showToast('Failed to update milestone.', 'error');
        } else {
            setMilestones(prev => ({
                ...prev,
                [projectId]: prev[projectId].map(m => m.id === milestoneId ? {...m, [field]: value} : m)
            }));
        }
    };

    const handleUpdateMilestoneStatus = async (projectId: string, milestoneId: string, status: Milestone['status']) => {
        const { error } = await supabase.from('project_milestones').update({ status }).eq('id', milestoneId);
        if (error) {
            showToast('Failed to update status', 'error');
        } else {
            setMilestones(prev => ({
                ...prev,
                [projectId]: prev[projectId].map(m => m.id === milestoneId ? {...m, status} : m)
            }));
        }
    };

    const handleDeleteMilestone = async (projectId: string, milestoneId: string) => {
        const { error } = await supabase.from('project_milestones').delete().eq('id', milestoneId);
        if (error) {
            showToast('Failed to delete milestone', 'error');
        } else {
            setMilestones(prev => ({...prev, [projectId]: prev[projectId].filter(m => m.id !== milestoneId)}));
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <Fragment>
            <Toast />
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all">
                    <FaArrowLeft />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Projects & Milestones</h1>
            </div>

            <form onSubmit={handleAddProject} className="flex gap-2 mb-8 bg-white p-4 rounded-xl shadow-md">
                <input type="text" value={newProjectName} onChange={e => setNewProjectName(e.target.value)} placeholder="New project name" className="flex-1 p-2 border rounded-lg" required />
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 flex items-center gap-2"><FaPlus/> Add Project</button>
            </form>

            <div className="space-y-8">
                {projects.map(project => {
                    const projectMstones = milestones[project.id] || [];
                    const completed = projectMstones.filter(m => m.status === 'Completed').length;
                    return (
                        <div key={project.id} className="bg-white p-6 rounded-xl shadow-md">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <CircularProgressBar completed={completed} total={projectMstones.length} size={80} strokeWidth={8} />
                                    <div>
                                        <h3 className="text-xl font-bold">{project.name}</h3>
                                        <p className="text-gray-500">{project.status}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteProject(project.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100"><FaTrash /></button>
                            </div>
                            <div className="mt-4 pl-4 border-l-2">
                                <h4 className="font-semibold mb-2">Milestones</h4>
                                <div className="space-y-2">
                                    {projectMstones.map(ms => (
                                        <div key={ms.id} className="p-2 bg-slate-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <InlineEdit value={ms.title} onSave={(val) => handleUpdateMilestone(project.id, ms.id, 'title', val)} ariaLabel="Edit milestone title" />
                                                <div className="flex items-center gap-2">
                                                     <select value={ms.status} onChange={e => handleUpdateMilestoneStatus(project.id, ms.id, e.target.value as Milestone['status'])} className="text-xs p-1 border rounded-md">
                                                         {milestoneStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                     </select>
                                                     <button onClick={() => handleDeleteMilestone(project.id, ms.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                                                </div>
                                            </div>
                                            <InlineEdit value={ms.description || ''} onSave={(val) => handleUpdateMilestone(project.id, ms.id, 'description', val)} ariaLabel="Edit milestone description" className="text-sm text-gray-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                    <input 
                                        type="text" 
                                        value={newMilestoneInputs[project.id]?.title || ''} 
                                        onChange={e => setNewMilestoneInputs(p => ({...p, [project.id]: {...p[project.id], title: e.target.value}}))} 
                                        placeholder="New milestone title" 
                                        className="w-full p-2 border rounded-lg text-sm" 
                                    />
                                    <textarea 
                                        value={newMilestoneInputs[project.id]?.description || ''} 
                                        onChange={e => setNewMilestoneInputs(p => ({...p, [project.id]: {...p[project.id], description: e.target.value}}))} 
                                        placeholder="Description (optional)"
                                        className="w-full p-2 border rounded-lg text-sm"
                                        rows={2}
                                    />
                                    <button onClick={() => handleAddMilestone(project.id)} className="px-3 py-2 bg-purple-600 text-white font-semibold rounded-lg text-sm self-start">Add Milestone</button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Fragment>
    );
}
