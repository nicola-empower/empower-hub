'use client'

import Link from 'next/link'; // Import the Link component

// --- Type Definitions ---
type Milestone = { 
  id: string; 
  title: string; 
  status: 'Pending' | 'In Progress' | 'Completed'; 
  start_date: string | null;
  due_date: string | null;
};

type Project = { 
  id: string; 
  name: string; 
  client_name?: string;
  milestones: Milestone[];
};

type KanbanBoardProps = {
  projects: Project[];
};

// --- Helper Components ---
const DateBadge = ({ date }: { date: string | null }) => {
  if (!date) return null;
  const formattedDate = new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  return (
    <span className="px-2 py-1 text-xs font-medium text-gray-300 bg-gray-600 rounded-full">
      🗓️ {formattedDate}
    </span>
  );
};

// --- Main Kanban Board Component (V3 with Manage Button) ---
export default function KanbanBoard({ projects }: KanbanBoardProps) {
  const statuses: Milestone['status'][] = ['Pending', 'In Progress', 'Completed'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex space-x-4 overflow-x-auto w-full pb-4">
        {/* Map over statuses to create columns */}
        {statuses.map((status) => (
          <div key={status} className="flex-shrink-0 w-96 bg-gray-100 rounded-lg shadow-inner">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-gray-100/80 backdrop-blur-sm rounded-t-lg">
              <h3 className="text-sm font-semibold text-gray-700">{status}</h3>
            </div>
            
            <div className="p-4 space-y-4 h-full">
              {/* Map over projects to create swimlanes */}
              {projects.map((project) => {
                const milestonesInStatus = project.milestones.filter(
                  (milestone) => milestone.status === status
                );
                if (milestonesInStatus.length === 0) return null;

                return (
                  <div key={project.id}>
                    {/* --- THIS IS THE UPDATED SECTION --- */}
                    <div className="px-1 mb-2 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-purple-700">{project.name}</h4>
                        <p className="text-xs text-gray-500">Client: {project.client_name}</p>
                      </div>
                      {/* Manage Button Added Back */}
                      <Link 
                        href={`/admin/projects/${project.id}`} 
                        className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                    {/* --- END OF UPDATE --- */}

                    <div className="space-y-3">
                      {milestonesInStatus.map((milestone) => (
                        <div key={milestone.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 space-y-3">
                          <p className="font-medium text-gray-900">{milestone.title}</p>
                          {/* We can re-add dates here if you like, they were removed in the dark theme version */}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}