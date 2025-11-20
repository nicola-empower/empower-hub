// app/nicola/social-genie/page.tsx
'use client';

import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { createClient, type User, type SupabaseClient } from '@supabase/supabase-js';
import { Loader2, Calendar, Sparkles, Edit, Link, Image as ImageIcon, Trash2 } from 'lucide-react';

// This type should match your 'content_plans' table structure
type ContentPlan = {
  id: number;
  created_at: string;
  user_id: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  status: 'Draft' | 'Scheduled' | 'Published' | 'Failed';
  publish_at: string | null;
};

// Using your corrected, ref-based PostCard for optimal performance
const PostCard = memo(function PostCard({ 
    post,
    supabase,
    onSchedule,
    onDelete 
}: { 
    post: ContentPlan,
    supabase: SupabaseClient<any, "public", any> | null,
    onSchedule: (id: number, scheduleDate: string) => void,
    onDelete: (id: number) => void 
}) {
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const imageUrlRef = useRef<HTMLInputElement>(null);
    const linkUrlRef = useRef<HTMLInputElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const [scheduleDate, setScheduleDate] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    // Initialize refs with post data
    useEffect(() => {
        if (bodyRef.current) bodyRef.current.value = post.body;
        if (imageUrlRef.current) imageUrlRef.current.value = post.image_url || '';
        if (linkUrlRef.current) linkUrlRef.current.value = post.link_url || '';
    }, [post.id]); // Only run when post ID changes

    const handleInputChange = useCallback(() => {
        if (!supabase) return;
        
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout for database save
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                const updates: Partial<ContentPlan> = {};
                
                if (bodyRef.current && bodyRef.current.value !== post.body) {
                    updates.body = bodyRef.current.value;
                }
                if (imageUrlRef.current && imageUrlRef.current.value !== (post.image_url || '')) {
                    updates.image_url = imageUrlRef.current.value || null;
                }
                if (linkUrlRef.current && linkUrlRef.current.value !== (post.link_url || '')) {
                    updates.link_url = linkUrlRef.current.value || null;
                }
                
                if (Object.keys(updates).length > 0) {
                    const { error } = await supabase
                        .from('content_plans')
                        .update(updates)
                        .eq('id', post.id);
                    
                    if (error) {
                        console.error('Failed to save changes:', error);
                    }
                }
            } catch (err) {
                console.error('Error saving changes:', err);
            }
        }, 1000);
    }, [post.id, post.body, post.image_url, post.link_url, supabase]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);
    
    return (
      <div className="bg-white/10 backdrop-blur-lg p-5 rounded-2xl border border-white/20 shadow-lg">
        <div className="flex flex-col gap-4">
            <textarea
              ref={bodyRef}
              onChange={handleInputChange}
              className="w-full h-32 bg-gray-800 text-gray-200 p-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              placeholder="Post content..."
              defaultValue={post.body}
            />
            <div className="flex items-center gap-3">
                <ImageIcon className="text-gray-400" size={20}/>
                <input 
                    ref={imageUrlRef}
                    type="text"
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 text-gray-200 p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Image URL..."
                    defaultValue={post.image_url || ''}
                />
            </div>
             <div className="flex items-center gap-3">
                <Link className="text-gray-400" size={20}/>
                <input 
                    ref={linkUrlRef}
                    type="text"
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 text-gray-200 p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Link URL..."
                    defaultValue={post.link_url || ''}
                />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input 
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="flex-grow bg-gray-800 text-gray-200 p-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <button 
                    onClick={() => onSchedule(post.id, scheduleDate)}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Calendar size={18} />
                    Schedule
                </button>
                 <button 
                    onClick={() => onDelete(post.id)}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
      </div>
    );
});

export default function SocialGeniePage() {
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are not set.");
        return null;
    }
    return createClient(supabaseUrl, supabaseKey);
  });

  const [user, setUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<ContentPlan[]>([]);

  const fetchPosts = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Could not fetch posts. ' + error.message);
      } else {
        setPosts(data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase) {
        const checkUserAndFetch = async () => {
          try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            
            setUser(user);
            if (user) {
              await fetchPosts();
            } else {
              setIsLoading(false);
            }
          } catch (err) {
            console.error('Auth error:', err);
            setError('Authentication failed');
            setIsLoading(false);
          }
        };
        checkUserAndFetch();
    } else {
        setIsLoading(false);
        setError("Supabase client is not configured. Please check your environment variables.");
    }
  }, [supabase, fetchPosts]);

  const handleGeneratePosts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // *** Pointing to the known working /api/test route ***
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'An unknown error occurred.');
      }
      
      await fetchPosts();
      setTopic('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate posts');
    } finally {
      setIsGenerating(false);
    }
  };

  // Stable callback references
  const handleSchedule = useCallback(async (id: number, scheduleDate: string) => {
    if (!supabase) return;
    
    try {
      const updates = { 
        status: 'Scheduled' as const, 
        publish_at: new Date(scheduleDate).toISOString() 
      };
      
      const { data, error } = await supabase
          .from('content_plans')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
          
      if (error) throw error;
      
      setPosts(prev => prev.map(p => p.id === id ? data : p));
      setError(null);
    } catch (err: any) {
      setError('Failed to schedule post: ' + (err.message || 'Unknown error'));
    }
  }, [supabase]);

  const handleDelete = useCallback(async (id: number) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
          .from('content_plans')
          .delete()
          .eq('id', id);
          
      if (error) throw error;
      
      setPosts(prev => prev.filter(p => p.id !== id));
      setError(null);
    } catch (err: any) {
      setError('Failed to delete post: ' + (err.message || 'Unknown error'));
    }
  }, [supabase]);

  // Memoized computed values
  const draftPosts = useMemo(() => 
    posts.filter(p => p.status === 'Draft'), 
    [posts]
  );
  
  const scheduledPosts = useMemo(() => 
      posts.filter(p => p.status === 'Scheduled')
           .sort((a, b) => {
               const dateA = a.publish_at ? new Date(a.publish_at).getTime() : 0;
               const dateB = b.publish_at ? new Date(b.publish_at).getTime() : 0;
               return dateA - dateB;
           }),
      [posts]
  );

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center">
            <Loader2 className="animate-spin text-purple-400" size={48} />
        </div>
    );
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">
            <p>Please log in to use the Social Genie.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Social Genie
          </h1>
          <p className="text-gray-400 mt-2">Your content is now saved automatically.</p>
        </header>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 shadow-lg">
          <form onSubmit={handleGeneratePosts} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a topic for your social media posts..."
              className="flex-grow bg-gray-800 text-white placeholder-gray-400 px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={isGenerating || !topic.trim()}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              <span>{isGenerating ? 'Generating...' : 'Generate Posts'}</span>
            </button>
          </form>
        </div>
        
        {error && (
          <div className="text-red-400 mt-4 text-center bg-red-900/50 p-3 rounded-lg">
            {error}
          </div>
        )}
        
        {isGenerating && (
            <div className="flex justify-center items-center gap-4 my-8">
                <Loader2 className="animate-spin text-purple-400" size={32} />
                <p className="text-lg text-gray-300">The Genie is writing your posts and saving them...</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section>
                <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-purple-300">
                    <Edit /> Drafts ({draftPosts.length})
                </h2>
                {draftPosts.length > 0 ? (
                    <div className="space-y-6">
                        {draftPosts.map(post => (
                            <PostCard 
                                key={post.id} 
                                post={post}
                                supabase={supabase}
                                onSchedule={handleSchedule}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    !isGenerating && (
                      <p className="text-gray-500 text-center py-8">
                        No drafts. Generate some posts to get started!
                      </p>
                    )
                )}
            </section>

            <section>
                <h2 className="flex items-center gap-3 text-2xl font-semibold mb-6 text-green-300">
                    <Calendar /> Content Calendar ({scheduledPosts.length})
                </h2>
                {scheduledPosts.length > 0 ? (
                    <div className="space-y-4">
                        {scheduledPosts.map(post => (
                            <div key={post.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <p className="text-gray-300">{post.body}</p>
                                <div className="text-xs text-green-400 mt-3 font-mono">
                                    Scheduled for: {
                                        post.publish_at ? new Date(post.publish_at).toLocaleString() : 'Not scheduled'
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">Your scheduled posts will appear here.</p>
                )}
            </section>
        </div>
      </div>
    </div>
  );
}
