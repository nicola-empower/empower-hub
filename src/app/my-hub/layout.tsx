// src/app/my-hub/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; 
import { useState, useEffect } from 'react';
import {
  FaTachometerAlt, FaFileInvoiceDollar, FaFolder, FaTasks, FaMagic, FaCalculator, FaUsers, FaBell, FaFileSignature, FaCalendarAlt, FaSitemap, FaClock,
  FaUserSecret, FaPercentage, FaSignOutAlt // Added Sign Out Icon
} from 'react-icons/fa';

// --- Global Notification Component ---
const ClientNotifications = ({ supabase }: { supabase: any }) => {
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!supabase) return;

        const fetchUnread = async () => {
            const { count } = await supabase
                .from('messages')
                .select('message_id', { count: 'exact', head: true })
                .eq('sender_type', 'client');
            setUnreadCount(count || 0);
        };
        fetchUnread();

        const channel = supabase
            .channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'sender_type=eq.client' },
                () => fetchUnread()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase]);

    if (unreadCount === 0) return null;

    return (
        <Link href="/admin" className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
            <FaBell className="w-6 h-6 animate-pulse" />
            <span>{unreadCount} New Client Message{unreadCount > 1 && 's'}</span>
        </Link>
    );
};

// --- Sign Out Button Component (Corrected) ---
// This now uses a form, which is the standard and most reliable way to handle sign-out.
const SignOutButton = () => {
    return (
        <form action="/api/auth/signout" method="post">
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-lg font-medium bg-gray-600 hover:bg-red-700 transition-colors"
            >
                <FaSignOutAlt className="w-6 h-6" />
                <span>Sign Out</span>
            </button>
        </form>
    );
};


export default function MyHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase environment variables are not set in layout.");
        return null;
    }
    return createClient(supabaseUrl, supabaseKey);
  });

  const navLinks = [
    { href: '/my-hub', label: 'Overview', icon: FaTachometerAlt },
    { href: '/my-hub/timetracker', label: 'Time Tracker', icon: FaClock },
    { href: '/my-hub/tasks', label: 'My To-Do', icon: FaTasks },
    { href: '/my-hub/planarchy', label: 'Planarchy', icon: FaSitemap },
    { href: '/my-hub/contentplan', label: 'Content Planner', icon: FaCalendarAlt },
    { href: '/my-hub/documents', label: 'My Documents', icon: FaFolder },
    { href: '/my-hub/social', label: 'Social Genie', icon: FaMagic },
    { href: '/my-hub/finances', label: 'Finances', icon: FaFileInvoiceDollar },
    { href: '/my-hub/taxes', label: 'Tax Calculator', icon: FaPercentage },
    { href: '/my-hub/quote', label: 'Quote Builder', icon: FaFileSignature },
    { href: '/my-hub/invoice', label: 'Invoice Generator', icon: FaCalculator },
  ];

  const personalLink = { href: '/nicola/dashboard', label: 'Nicola Hub', icon: FaUserSecret };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-72 flex-shrink-0 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-700">
          <h1 className="text-2xl font-bold">My Hub</h1>
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
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
              >
                <link.icon className="w-6 h-6" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-700 space-y-2">
            <ClientNotifications supabase={supabase} />
            <Link
              href={personalLink.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                  pathname.startsWith('/nicola')
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-700 hover:bg-violet-700'
              }`}
            >
              <personalLink.icon className="w-6 h-6" />
              {personalLink.label}
            </Link>
            <Link href="/admin" className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-lg font-medium bg-gray-700 hover:bg-gray-600 transition-colors">
                <FaUsers className="w-6 h-6" />
                <span>Client Hub</span>
            </Link>
            {/* --- ADDED SIGN OUT BUTTON HERE --- */}
            <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
