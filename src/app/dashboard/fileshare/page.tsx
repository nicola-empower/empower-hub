// src/app/dashboard/fileshare/page.tsx
'use client';

import { useState, useEffect, Fragment } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/app/components/HelperComponents';
import { FaLink, FaPaperPlane } from 'react-icons/fa';

// --- Type Definitions ---
type LinkShare = {
  id: string;
  title: string;
  url: string;
  sender_type: 'client' | 'admin';
};

// --- Main File Share Page Component ---
export default function FileSharePage() {
  const [links, setLinks] = useState<LinkShare[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast, Toast } = useToast();

  // Form state
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('links')
        .select('id, title, url, sender_type')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        showToast('Could not fetch links.', 'error');
      } else {
        setLinks(data as LinkShare[]);
      }
      setLoading(false);
    };
    fetchLinks();
  }, []);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
        showToast('Please provide both a title and a URL.', 'error');
        return;
    }
    
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        showToast('You must be logged in.', 'error');
        setSubmitting(false);
        return;
    }

    try {
        const { data: newLink, error } = await supabase
            .from('links')
            .insert({
                client_id: user.id,
                title: newLinkTitle,
                url: newLinkUrl,
                sender_type: 'client',
            })
            .select()
            .single();

        if (error) throw error;

        setLinks(prev => [newLink as LinkShare, ...prev]);
        setNewLinkTitle('');
        setNewLinkUrl('');
        showToast('Link shared successfully!', 'success');
    } catch (error: any) {
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading links...</div>;
  }

  return (
    <Fragment>
      <Toast />
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">File & Link Share</h1>
        <p className="text-lg text-gray-600 mt-1">Share useful links and resources with us.</p>
      </header>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8" aria-label="Share a New Link">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Share a New Link</h3>
        <form onSubmit={handleAddLink} className="space-y-4">
            <input type="text" value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)} placeholder="Link Title (e.g., 'Website Inspiration')" className="w-full p-3 rounded-xl border border-gray-300" required />
            <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)} placeholder="https://example.com" className="w-full p-3 rounded-xl border border-gray-300" required />
            <button type="submit" disabled={submitting} className="w-full px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                <FaPaperPlane />
                {submitting ? 'Sharing...' : 'Share Link'}
            </button>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8" aria-label="Shared Links">
        <div className="space-y-4">
          {links.map(link => (
            <div key={link.id} className="border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${link.sender_type === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <FaLink />
                    </div>
                    <div>
                        <h4 className="font-semibold">{link.title}</h4>
                        <p className="text-sm text-gray-500">{link.sender_type === 'admin' ? 'Shared by us' : 'Shared by you'}</p>
                    </div>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg">
                    Open Link
                </a>
            </div>
          ))}
        </div>
      </section>
    </Fragment>
  );
}
