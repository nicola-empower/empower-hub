'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ClientActivity = {
  id: string;
  client_id: string;
  action: string;
  details: {
    docId?: string;
    docTitle?: string;
    // Add other details here as needed
  } | null;
  event_type: string; // NEW: The event_type field
  created_at: string;
};

// This component fetches and displays a list of recent activities for a client.
// It's meant to be used on the admin side.
export default function ClientActivityFeed({ clientId }: { clientId: string }) {
  const [activity, setActivity] = useState<ClientActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('client_activity')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(20); // Increased limit to get a better overview

      if (error) {
        console.error('Error fetching activity feed:', error);
        setError('Failed to load recent activity.');
        setActivity([]);
      } else {
        setActivity(data as ClientActivity[]);
      }
      setLoading(false);
    };

    if (clientId) {
      fetchActivity();
    }
  }, [clientId]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 mb-12" aria-label="Client Activity Feed">
      <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading activity...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">{error}</div>
      ) : (
        <ul className="space-y-4">
          {activity.length === 0 ? (
            <li className="text-center text-gray-500 py-6">No recent activity.</li>
          ) : (
            activity.map(item => (
              <li 
                key={item.id} 
                className={`text-sm p-3 rounded-lg ${item.event_type === 'security_alert' ? 'bg-red-50 border-l-4 border-red-500 text-red-800 font-semibold' : 'bg-gray-50 text-gray-700'}`}
              >
                {item.event_type === 'security_alert' && (
                  <span className="font-bold">⚠️ SECURITY ALERT: </span>
                )}
                {item.action}
                {item.details?.docTitle && <span className="ml-1 font-normal">on "{item.details.docTitle}"</span>}
                <br />
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
