// src/app/admin/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Client = {
  client_id: string;
  name: string;
  email: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [view, setView] = useState<'list' | 'add'>('list');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching clients:', error.message);
            setMessage({ text: 'Could not fetch clients.', type: 'error' });
        } else {
            setClients(data as Client[]);
        }
        setLoading(false);
    };
    fetchClients();
  }, []);

  // --- UPDATED FUNCTION TO FIX TYPESCRIPT ERROR ---
  const handleNewClientSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!newClientName || !newClientEmail) {
      setMessage({ text: 'Please fill out all fields.', type: 'error' });
      setSubmitting(false);
      return;
    }

    try {
      // Invite the user via Supabase Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('invite-user', {
        body: { email: newClientEmail },
      });

      if (functionError) throw functionError;
      
      const invitedUserId = functionData.data.user.id;
      
      // Insert the new client into the 'clients' table and select it back
      const { data, error } = await supabase
        .from('clients')
        .insert([{ client_id: invitedUserId, name: newClientName, email: newClientEmail }])
        .select();

      if (error) {
        throw new Error('User invited, but failed to add to clients list.');
      }

      // Check if data is not null and has at least one item
      if (data && data.length > 0) {
        const newClient = data[0] as Client;
        // Prepend the new client to the existing list
        setClients(prevClients => [newClient, ...prevClients]);
        
        // Reset form and view
        setNewClientName('');
        setNewClientEmail('');
        setView('list');
        setMessage({ text: 'Client successfully invited!', type: 'success' });
      } else {
        throw new Error('Failed to retrieve the new client record.');
      }

    } catch (error: any) {
      const specificError = error.context?.error?.message || error.message;
      setMessage({ text: `Error: ${specificError}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
      return (
          <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
              <p className="text-gray-500 mt-4">Loading clients...</p>
          </div>
      );
  }

  return (
    <>
      {view === 'list' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Your Client Dashboard</h3>
                    <p className="text-gray-600 text-sm mt-1">Manage and track all your clients in one place.</p>
                </div>
                <button
                    onClick={() => { setView('add'); setMessage(null); }}
                    className="px-6 py-3 text-white font-medium rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add New Client
                </button>
            </div>
            {message && <p className={`mb-4 text-center p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.text}</p>}
            <div className="space-y-4">
            {clients.length > 0 ? clients.map((client) => (
                <div key={client.client_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                                {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">{client.name}</h4>
                                <p className="text-gray-600 text-sm">{client.email}</p>
                            </div>
                        </div>
                        <Link href={`/admin/${client.client_id}`} className="px-5 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200 transition-all">
                            Manage Client
                        </Link>
                    </div>
                </div>
            )) : (
                <div className="text-center py-16">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
                    <p className="text-gray-600">Get started by adding your first client.</p>
                </div>
            )}
            </div>
        </div>
      )}

      {view === 'add' && (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <div className="flex items-center mb-8">
                <button onClick={() => setView('list')} className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Client</h2>
                    <p className="text-gray-600 text-sm mt-1">Create a new client account and send them an invitation email.</p>
                </div>
            </div>
            <div className="max-w-md">
                <form onSubmit={handleNewClientSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                        <input type="text" id="clientName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="Enter client's full name" required />
                    </div>
                    <div>
                        <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-2">Client Email</label>
                        <input type="email" id="clientEmail" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="Enter client's email address" required />
                    </div>
                    {message && <p className={`my-4 text-center p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message.text}</p>}
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setView('list')} className="flex-1 px-6 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 px-6 py-3 text-white font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg disabled:opacity-50">
                            {submitting ? 'Inviting...' : 'Invite Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
}
