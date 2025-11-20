// src/app/dashboard/projects/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { CircularProgressBar } from '@/app/components/CircularProgressBar';
import { FaProjectDiagram, FaCheckCircle, FaSpinner, FaCircle } from 'react-icons/fa';

// --- Type Definitions ---
type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: 'Pending' | 'In Progress' | 'Completed';
  sort_order: number;
};

type Project = {
  id: string;
  name: string;
  status: string;
  project_milestones: Milestone[];
};

// --- Helper Components ---
const MilestoneIcon = ({ status }: { status: Milestone['status'] }) => {
  if (status === 'Completed') {
    return <FaCheckCircle className="text-emerald-500 w-6 h-6 z-10" />;
  }
  if (status === 'In Progress') {
    return <FaSpinner className="text-purple-500 w-6 h-6 z-10 animate-spin" />;
  }
  return <FaCircle className="text-gray-300 w-6 h-6 z-10" />;
};

// --- Main Projects Page Component ---
export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, Toast } = useToast();

  useEffect(() => {
    const fetchClientProjects = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', user.id)
          .in('status', ['Active', 'In Progress'])
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        if (projectsData) {
          const projectsWithMilestones = await Promise.all(
            projectsData.map(async (project) => {
              const { data: milestonesData } = await supabase
                .from('project_milestones')
                .select('*')
                .eq('project_id', project.id)
                .order('sort_order', { ascending: true });
              return { ...project, project_milestones: milestonesData || [] };
            })
          );
          setProjects(projectsWithMilestones);
        }
      } catch (error: any) {
        showToast('Could not fetch projects: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchClientProjects();
    // THE FIX: The dependency array is now empty to prevent the loop.
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading projects...</div>;
  }

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Projects</h1>
        <p className="text-lg text-gray-600 mt-1">Track the progress of our work together.</p>
      </header>

      <div className="space-y-12">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
            <FaProjectDiagram className="mx-auto text-5xl text-gray-300 mb-4" />
            <h4 className="text-xl font-medium text-gray-900">No Active Projects</h4>
            <p className="text-gray-500">You don't have any projects currently in progress.</p>
          </div>
        ) : (
          projects.map((project) => {
            const completedMilestones = project.project_milestones.filter(m => m.status === 'Completed').length;
            const totalMilestones = project.project_milestones.length;

            return (
              <section key={project.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8" aria-label={`Project: ${project.name}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="md:col-span-1 flex flex-col items-center text-center">
                    <CircularProgressBar
                      completed={completedMilestones}
                      total={totalMilestones}
                    />
                    <h3 className="text-2xl font-bold text-gray-900 mt-4">{project.name}</h3>
                    <p className="text-lg text-gray-500">{project.status}</p>
                  </div>
                  <div className="md:col-span-2">
                    <div className="relative border-l-2 border-dashed border-gray-300 pl-8 space-y-6">
                      {project.project_milestones.map((milestone) => (
                        <div key={milestone.id} className="relative flex items-start gap-4">
                            <div className="absolute -left-[45px] top-1">
                                <MilestoneIcon status={milestone.status} />
                            </div>
                            <div className={`flex-1 ${milestone.status === 'Pending' ? 'opacity-60' : ''}`}>
                                <h4 className={`font-bold text-lg ${milestone.status === 'Completed' ? 'text-emerald-800' : milestone.status === 'In Progress' ? 'text-purple-800' : 'text-gray-800'}`}>
                                    {milestone.title}
                                </h4>
                                {(milestone.description && milestone.status !== 'Completed') && (
                                    <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </Fragment>
  );
}
