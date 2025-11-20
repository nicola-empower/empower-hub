'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { CircularProgressBar } from '@/app/components/CircularProgressBar';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { FaProjectDiagram, FaEnvelope, FaTasks, FaArrowRight } from 'react-icons/fa';

// --- Type Definitions for Summary Data ---
type ProjectSummary = {
	name: string;
	completed_milestones: number;
	total_milestones: number;
};

// --- Main Dashboard Page Component ---
export default function DashboardPage() {
	const router = useRouter();
	const { showToast, Toast } = useToast();

	const [clientName, setClientName] = useState('Valued Client');
	const [loading, setLoading] = useState(true);

	// State for our dashboard widgets
	const [project, setProject] = useState<ProjectSummary | null>(null);
	const [unreadMessages, setUnreadMessages] = useState(0);
	const [pendingTasks, setPendingTasks] = useState(0);

	useEffect(() => {
		const fetchDashboardData = async () => {
			setLoading(true);
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) {
				router.push('/login');
				return;
			}

			try {
				// Fetch all data in parallel for speed
				const [clientRes, projectRes, messagesRes, tasksRes] = await Promise.all([
					supabase.from('clients').select('name').eq('client_id', user.id).single(),
					supabase.from('projects').select('id, name').eq('client_id', user.id).in('status', ['Active', 'In Progress']).limit(1).single(),
					// CRITICAL FIX #1: Added .eq('is_read', false) to the message count query
					supabase.from('messages').select('message_id', { count: 'exact', head: true }).eq('client_id', user.id).eq('sender_type', 'admin').eq('is_read', false),
					supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('client_id', user.id).eq('status', 'pending')
				]);

				if (clientRes.data) setClientName(clientRes.data.name);

				// Process Project Data
				if (projectRes.data) {
					const { data: milestones } = await supabase.from('project_milestones').select('status').eq('project_id', projectRes.data.id);
					const completed = milestones?.filter(m => m.status === 'Completed').length || 0;
					setProject({ name: projectRes.data.name, completed_milestones: completed, total_milestones: milestones?.length || 0 });
				}

				// Process Messages and Tasks Count
				setUnreadMessages(messagesRes.count || 0);
				setPendingTasks(tasksRes.count || 0);

			} catch (error: any) {
				showToast('Could not load dashboard data.', 'error');
			} finally {
				setLoading(false);
			}
		};
		fetchDashboardData();
	}, [router, showToast]);

	if (loading) {
		return <DashboardSkeleton />;
	}

	return (
		<Fragment>
			<Toast />
			<header className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900">Welcome, {clientName}!</h1>
				<p className="text-lg text-gray-600 mt-1">Here's a quick overview of what's new.</p>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				{/* Project Widget */}
				<Link href="/dashboard/projects" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-purple-300 transition-all">
					<div>
						<div className="flex items-center gap-3 text-purple-600 mb-4">
							<FaProjectDiagram className="w-6 h-6" />
							<h3 className="text-xl font-bold">Active Project</h3>
						</div>
						{project ? (
							<div className="flex flex-col items-center text-center">
								<CircularProgressBar completed={project.completed_milestones} total={project.total_milestones} />
								<p className="font-semibold text-lg mt-4">{project.name}</p>
							</div>
						) : (
							<p className="text-center text-gray-500 py-10">No active projects.</p>
						)}
					</div>
					<div className="flex items-center justify-end text-sm font-medium text-purple-600 mt-4">
						View Details <FaArrowRight className="ml-2" />
					</div>
				</Link>

				{/* Messages Widget */}
				<Link href="/dashboard/messages" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-purple-300 transition-all">
					<div>
						<div className="flex items-center gap-3 text-emerald-600 mb-4">
							<FaEnvelope className="w-6 h-6" />
							<h3 className="text-xl font-bold">Messages</h3>
						</div>
						<div className="text-center">
							<p className="text-6xl font-bold text-gray-800">{unreadMessages}</p>
							<p className="text-lg text-gray-500">New Message{unreadMessages !== 1 && 's'}</p>
						</div>
					</div>
					<div className="flex items-center justify-end text-sm font-medium text-emerald-600 mt-4">
						Open Messages <FaArrowRight className="ml-2" />
					</div>
				</Link>

				{/* To Do Widget */}
				<Link href="/dashboard/tasks" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl hover:border-purple-300 transition-all">
					<div>
						<div className="flex items-center gap-3 text-amber-600 mb-4">
							<FaTasks className="w-6 h-6" />
							<h3 className="text-xl font-bold">To-Do List</h3>
						</div>
						<div className="text-center">
							<p className="text-6xl font-bold text-gray-800">{pendingTasks}</p>
							<p className="text-lg text-gray-500">Item{pendingTasks !== 1 && 's'} to Complete</p>
						</div>
					</div>
					<div className="flex items-center justify-end text-sm font-medium text-amber-600 mt-4">
						View To-Do's <FaArrowRight className="ml-2" />
					</div>
				</Link>
			</div>
		</Fragment>
	);
}
