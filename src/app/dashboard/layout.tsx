// src/app/dashboard/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react'; // Import useState and useEffect
import {
  FaTachometerAlt, FaFileAlt, FaProjectDiagram, FaEnvelope, FaSignOutAlt,
  FaTasks, FaShareAlt, FaCog, FaClock // --- ADDED ICONS ---
} from 'react-icons/fa';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showTimeTracker, setShowTimeTracker] = useState(false); // State to control link visibility

  useEffect(() => {
    const checkContract = async () => {
      // Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if a contract exists for this user in the client_contracts table
      const { data, error } = await supabase
        .from('client_contracts')
        .select('client_id')
        .eq('client_id', user.id)
        .single();

      // If data is found (no error), it means a contract exists, so show the link
      if (data && !error) {
        setShowTimeTracker(true);
      }
    };

    checkContract();
  }, []); // Empty array means this runs once on component load

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Base navigation links
  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { href: '/dashboard/documents', label: 'Documents', icon: FaFileAlt },
    { href: '/dashboard/projects', label: 'Projects', icon: FaProjectDiagram },
    { href: '/dashboard/messages', label: 'Messages', icon: FaEnvelope },
    { href: '/dashboard/tasks', label: 'To Do', icon: FaTasks },
    { href: '/dashboard/fileshare', label: 'File Share', icon: FaShareAlt },
  ];

  // Conditionally add the time tracker link
  if (showTimeTracker) {
    navLinks.push({ href: '/dashboard/timetracker', label: 'Time Tracker', icon: FaClock });
  }

  const bottomLinks = [
    { href: '/dashboard/settings', label: 'Settings', icon: FaCog },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <h1 className="text-2xl font-bold text-purple-600">Empower Hub</h1>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <link.icon className="w-6 h-6" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
            {bottomLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                        isActive
                            ? 'bg-gray-200 text-gray-800'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <link.icon className="w-6 h-6" />
                        {link.label}
                    </Link>
                );
            })}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <FaSignOutAlt className="w-6 h-6" />
              Sign Out
            </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
