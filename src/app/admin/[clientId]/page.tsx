'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaFileAlt, FaProjectDiagram, FaEnvelope, FaTasks, FaShareAlt, FaArrowRight, FaPlus, FaClock } from 'react-icons/fa';
import { CircularProgressBar } from '@/app/components/CircularProgressBar';

// --- Type Definitions ---
type Client = { name: string; };
type ProjectSummary = { name: string; completed_milestones: number; total_milestones: number; };
type AdminNote = { id: string; note_content: string; created_at: string; };

export default function ClientManagementPage() {
    const router = useRouter();
    const { clientId } = useParams<{ clientId: string }>();
    const { showToast, Toast } = useToast();

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);

    // State for dashboard widgets
    const [project, setProject] = useState<ProjectSummary | null>(null);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);
    const [notes, setNotes] = useState<AdminNote[]>([]); 
    const [newNote, setNewNote] = useState('');

    // --- Data Fetching Logic (Memoized for stability) ---
    // IMPORTANT: Removed 'router' from dependency array by moving error handling out.
    const fetchDashboardData = useCallback(async () => {
        if (!clientId) return;
        
        try {
            // Fetch all widget data in parallel
            const [clientRes, projectRes, messagesRes, tasksRes] = await Promise.all([
                supabase.from('clients').select('name').eq('client_id', clientId).single(),
                supabase.from('projects').select('id, name').eq('client_id', clientId).in('status', ['Active', 'In Progress']).limit(1).single(),
                // CRITICAL: Filter for unread messages only (sender=client, admin has not read)
                supabase.from('messages').select('message_id', { count: 'exact', head: true }).eq('client_id', clientId).eq('sender_type', 'client').eq('is_read_admin', false),
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'pending'),
            ]);

            // If the client doesn't exist, throw an error to trigger the redirect in the useEffect.
            if (clientRes.error && clientRes.error.code !== 'PGRST116') throw clientRes.error;
            if (!clientRes.data) throw new Error("Client not found.");

            // Update Client Name
            setClient(clientRes.data);
            
            // Handle Project Data
            if (projectRes.data) {
                const { data: milestones } = await supabase.from('project_milestones').select('status').eq('project_id', projectRes.data.id);
                const completed = milestones?.filter(m => m.status === 'Completed').length || 0;
                setProject({ name: projectRes.data.name, completed_milestones: completed, total_milestones: milestones?.length || 0 });
            } else {
                setProject(null);
            }
            
            // Update widget counts
            setUnreadMessages(messagesRes.count || 0);
            setPendingTasks(tasksRes.count || 0);
            
        } catch (error: any) {
            console.error('Dashboard refresh failed:', error);
            // Throw the error so the calling useEffect can handle the redirect gracefully
            throw error; 
        } 
    }, [clientId, showToast]); // Now only dependent on stable state/props

    // --- CRITICAL FIX 1: Main Data Load & Widget Real-Time Subscription ---
    useEffect(() => {
        if (!clientId) return;
        
        // Initial load function (sets the initial loading state correctly)
        const initialLoad = async () => {
            setLoading(true);
            try {
                // Fetch the data and also fetch the notes initially
                await Promise.all([fetchDashboardData(), fetchInitialNotes()]);
            } catch (e) {
                console.error("Initial load failed, redirecting:", e);
                showToast('Client data failed to load. Redirecting...', 'error');
                router.push('/admin'); // Router call is stable here
            } finally {
                 setLoading(false);
            }
        };
        
        initialLoad();

        // 2. Setup Real-time Listeners for changes in relevant widget data
        const widgetsToWatch = ['messages', 'projects', 'tasks'];
        const channels = widgetsToWatch.map(table => 
            supabase
                .channel(`admin-widget-${table}-${clientId}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: table, filter: `client_id=eq.${clientId}` },
                    () => fetchDashboardData() // Triggers fetchDashboardData ONLY on a relevant DB change
                )
                .subscribe()
        );

        // 3. Cleanup function
        return () => {
            channels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [clientId, fetchDashboardData, router, showToast]); // Dependencies are now clean

    // --- CRITICAL FIX 2: Dedicated Notes Subscription (Stops Flashing on Note Add) ---
    const fetchInitialNotes = async () => {
        if (!clientId) return;
        const { data: notesRes, error: notesError } = await supabase.from('admin_notes').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
        if (!notesError && notesRes) setNotes(notesRes as AdminNote[]);
    };

    useEffect(() => {
        if (!clientId) return;
        
        // Setup Real-time Listener for notes
        const notesChannel = supabase
            .channel(`admin-notes-${clientId}`)
            .on<AdminNote>(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'admin_notes', filter: `client_id=eq.${clientId}` },
                (payload) => {
                    setNotes(prev => [payload.new, ...prev]);
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            supabase.removeChannel(notesChannel);
        };
    }, [clientId]);


    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !clientId) return;
        
        // IMPORTANT: The update of the 'notes' state is handled by the dedicated useEffect listener above.
        const { error } = await supabase
            .from('admin_notes')
            .insert({ client_id: clientId, note_content: newNote.trim() });
            
        if (error) {
            showToast('Failed to add note.', 'error');
        } else {
            setNewNote(''); // Changing this small state does not trigger the main fetch
            showToast('Note added!', 'success');
        }
    };


    if (loading) return <div className="p-8 text-lg font-semibold text-center text-purple-600">Loading client details...</div>;

    if (!client) {
        return (
             <div className="p-8 bg-red-100 border-l-4 border-red-500 text-red-700">
                <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
                <p>The client with ID "{clientId}" could not be retrieved.</p>
                <button onClick={() => router.push('/admin')} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">Go Back to Admin List</button>
            </div>
        );
    }
    
    return (
        <Fragment>
            <Toast />
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/admin')} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900">Manage: {client.name}</h2>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-2xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4">Your Private Notes & Tasks</h3>
                        <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
                            <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a new note or task for this client..." className="flex-1 p-2 border rounded-lg"/>
                            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"><FaPlus/> Add</button>
                        </form>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                            {notes.length > 0 ? notes.map(note => (
                                <div key={note.id} className="bg-slate-50 p-3 rounded-lg text-sm">
                                    <p>{note.note_content}</p>
                                    <span className="block mt-1 text-xs text-gray-400">{new Date(note.created_at).toLocaleString()}</span>
                                </div>
                            )) : <p className="text-gray-500">No notes for this client yet.</p>}
                        </div>
                    </section>

                    <section className="bg-white rounded-2xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-4">Management Hub</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link href={`/admin/${clientId}/documents`} className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all aspect-square">
                                <FaFileAlt className="text-3xl mb-2" />
                                <span className="font-semibold text-center">Documents</span>
                            </Link>
                            <Link href={`/admin/${clientId}/projects`} className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all aspect-square">
                                <FaProjectDiagram className="text-3xl mb-2" />
                                <span className="font-semibold text-center">Projects</span>
                            </Link>
                            {/* --- NEW TIME TRACKER LINK --- */}
                            <Link href={`/admin/${clientId}/timetracker`} className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all aspect-square">
                                <FaClock className="text-3xl mb-2" />
                                <span className="font-semibold text-center">Time Tracker</span>
                            </Link>
                            <Link href={`/admin/${clientId}/messages`} className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all aspect-square">
                                <FaEnvelope className="text-3xl mb-2" />
                                <span className="font-semibold text-center">Messages</span>
                            </Link>
                            <Link href={`/admin/${clientId}/fileshare`} className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all aspect-square">
                                <FaShareAlt className="text-3xl mb-2" />
                                <span className="font-semibold text-center">Link Share</span>
                            </Link>
                        </div>
                    </section>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Link href={`/admin/${clientId}/projects`} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-all">
                        <div className="flex items-center gap-3 text-purple-600 mb-4">
                            <FaProjectDiagram className="w-6 h-6" />
                            <h3 className="text-xl font-bold">Project Progress</h3>
                        </div>
                         {project ? (
                            <div className="flex flex-col items-center text-center">
                                <CircularProgressBar completed={project.completed_milestones} total={project.total_milestones} />
                                <p className="font-semibold text-lg mt-4">{project.name}</p>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">No active projects.</p>
                        )}
                    </Link>
                    <Link href={`/admin/tasks?clientId=${clientId}`} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-xl transition-all">
                        <div>
                            <div className="flex items-center gap-3 text-amber-600 mb-4">
                                <FaTasks className="w-6 h-6" />
                                <h3 className="text-xl font-bold">Client To-Do's</h3>
                            </div>
                            <div className="text-center">
                                <p className="text-6xl font-bold text-gray-800">{pendingTasks}</p>
                                <p className="text-lg text-gray-500">Pending Items</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end text-sm font-medium text-amber-600 mt-4">
                            Manage To-Do's <FaArrowRight className="ml-2" />
                        </div>
                    </Link>
                </div>
            </div>
        </Fragment>
    );
}
