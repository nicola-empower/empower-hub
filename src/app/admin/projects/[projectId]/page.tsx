'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

// --- Type Definitions with all date fields ---
type Project = {
  id: string;
  name: string;
  client_name?: string;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
};

// --- Icon Components ---
const BackIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const AddIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;

export default function ManageProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper function to format dates for HTML date input fields
  const formatDateForInput = (dateString: string | null) => {
    return dateString ? dateString.split('T')[0] : '';
  };

  useEffect(() => {
    if (!projectId) return;
    const fetchProjectData = async () => {
      setLoading(true);
      setError(null);
      
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`*, client:clients(name)`)
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        setError('Could not find the requested project.');
        setLoading(false);
        return;
      }
      
      const typedProjectData = projectData as any;
      setProject({
          ...typedProjectData,
          client_name: typedProjectData.client?.name || 'Unknown Client'
      });
      
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (milestonesError) {
        setError('Could not fetch project milestones.');
      } else {
        setMilestones(milestonesData as Milestone[]);
      }
      setLoading(false);
    };
    fetchProjectData();
  }, [projectId]);

  const handleStatusChange = async (milestoneId: string, newStatus: Milestone['status']) => {
    setMilestones(milestones.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m));
    await supabase.from('project_milestones').update({ status: newStatus }).eq('id', milestoneId);
  };

  const handleMilestoneDateChange = async (milestoneId: string, newDate: string, field: 'start_date' | 'due_date' | 'completed_at') => {
      setMilestones(milestones.map(m => m.id === milestoneId ? { ...m, [field]: newDate } : m));
      await supabase.from('project_milestones').update({ [field]: newDate }).eq('id', milestoneId);
  };
  
  const handleProjectDateChange = async (newDate: string, field: 'start_date' | 'due_date' | 'completed_date') => {
    if (!project) return;
    setProject({ ...project, [field]: newDate });
    await supabase.from('projects').update({ [field]: newDate }).eq('id', project.id);
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    await supabase.from('project_milestones').delete().eq('project_id', projectId);
    const { error: projectError } = await supabase.from('projects').delete().eq('id', projectId);
    if (projectError) {
      alert(`Failed to delete project: ${projectError.message}`);
    } else {
      alert('Project deleted successfully.');
      router.push('/admin/projects'); 
    }
  };

  const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      const { data, error } = await supabase.from('project_milestones').insert({
          project_id: projectId,
          title: newMilestoneTitle,
          description: newMilestoneDesc,
          status: 'Pending',
      }).select().single();
      if (error) {
          alert(`Failed to add milestone: ${error.message}`);
      } else {
          setMilestones([...milestones, data as Milestone]);
          setShowAddMilestone(false);
          setNewMilestoneTitle('');
          setNewMilestoneDesc('');
      }
      setIsSubmitting(false);
  };
  
  const getStatusColor = (status: Milestone['status']) => {
      switch (status) {
          case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-300';
          case 'In Progress': return 'bg-green-100 text-green-800 border-green-300';
          case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
          default: return 'bg-gray-100 text-gray-800 border-gray-300';
      }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading project details...</div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center text-red-500">{error}</div>
    );
  }

  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900">Are you sure?</h3>
            <p className="text-gray-600 my-4">This will permanently delete the project and all its milestones. This action cannot be undone.</p>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
              <button onClick={handleDeleteProject} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/projects" className="p-2 text-gray-500 hover:bg-gray-200 rounded-full">
              <BackIcon />
            </Link>
            <div>
              <p className="text-sm text-gray-500">Project</p>
              <h1 className="text-3xl font-bold text-gray-800">{project?.name}</h1>
              <p className="text-gray-500 mt-1">For: {project?.client_name}</p>
            </div>
          </div>
           <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 flex items-center gap-2">
            <TrashIcon /> Delete Project
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-gray-50 rounded-xl border">
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Start Date</label>

{/* Line 198: Applied the '?? null' fix for the date error */}
<input 
  type="date" 
  value={formatDateForInput(project?.start_date ?? null)} 
  onChange={(e) => handleProjectDateChange(e.target.value, 'start_date')} 
  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" 
/>
          </div>
          
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Due Date</label>
              <input type="date" value={formatDateForInput(project?.due_date)} onChange={(e) => handleProjectDateChange(e.target.value, 'due_date')} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" />
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Completed Date</label>
              <input type="date" value={formatDateForInput(project?.completed_date)} onChange={(e) => handleProjectDateChange(e.target.value, 'completed_date')} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Milestones</h2>
            <button onClick={() => setShowAddMilestone(!showAddMilestone)} className="px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-100 hover:bg-teal-200 rounded-lg flex items-center gap-2">
                <AddIcon/> {showAddMilestone ? 'Cancel' : 'Add Milestone'}
            </button>
          </div>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="p-4 rounded-lg bg-gray-50 border">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800">{milestone.title}</h3>
                    <p className="text-gray-600 text-sm">{milestone.description}</p>
                  </div>
                  <div className="flex items-end gap-4 flex-wrap">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input type="date" value={formatDateForInput(milestone.start_date)} onChange={(e) => handleMilestoneDateChange(milestone.id, e.target.value, 'start_date')} className="px-3 py-1.5 text-sm border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Due Date</label>
                      <input type="date" value={formatDateForInput(milestone.due_date)} onChange={(e) => handleMilestoneDateChange(milestone.id, e.target.value, 'due_date')} className="px-3 py-1.5 text-sm border rounded-lg" />
                    </div>
                    {milestone.status === 'Completed' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Completed</label>
                        <input type="date" value={formatDateForInput(milestone.completed_at)} onChange={(e) => handleMilestoneDateChange(milestone.id, e.target.value, 'completed_at')} className="px-3 py-1.5 text-sm border rounded-lg" />
                      </div>
                    )}
                    <select value={milestone.status} onChange={(e) => handleStatusChange(milestone.id, e.target.value as Milestone['status'])} className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${getStatusColor(milestone.status)}`}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {showAddMilestone && (
                <div className="p-4 rounded-lg bg-teal-50 border-2 border-dashed border-teal-300 mt-4">
                    <form onSubmit={handleAddMilestone} className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">Add New Milestone</h3>
                      <div>
                          <label htmlFor="newMilestoneTitle" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input id="newMilestoneTitle" type="text" value={newMilestoneTitle} onChange={(e) => setNewMilestoneTitle(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" required />
                      </div>
                      <div>
                          <label htmlFor="newMilestoneDesc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <input id="newMilestoneDesc" type="text" value={newMilestoneDesc} onChange={(e) => setNewMilestoneDesc(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300" />
                      </div>
                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowAddMilestone(false)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
                          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 disabled:opacity-50">
                              {isSubmitting ? 'Saving...' : 'Save Milestone'}
                          </button>
                      </div>
                    </form>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}