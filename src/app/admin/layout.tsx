// src/app/admin/layout.tsx
'use client'; // <-- Add this to use hooks

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // <-- Import usePathname

// You can keep the icon as a small component here for cleanliness
const SignOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export default function AdminLayout({
  children, // This will be the page content rendered by Next.js
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // <-- Get the current path

  const navLinks = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/clients', label: 'Clients' },
    { href: '/admin/projects', label: 'Projects' },
    { href: '/admin/tasks', label: 'Tasks' },
    { href: '/admin/documents', label: 'Documents' },
    { href: '/admin/timetracker', label: 'Time Tracker' }, // <-- New link added here
    { href: '/admin/crm', label: 'CRM' },
    { href: '/admin/quotes', label: 'Quotes' },
    { href: '/admin/invoices', label: 'Invoices' },
    { href: '/admin/messages', label: 'Messages' },
    { href: '/my-hub', label: 'My Hub' },
  ];

  return (
    <div className="flex h-screen bg-white font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#1a202c] text-gray-200 flex flex-col">
        <div className="h-20 flex items-center justify-center border-b border-gray-500/30">
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-wider text-white">EMPOWER</h1>
            <p className="text-xs text-gray-400">VIRTUAL</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map(link => {
                // Check if the current path matches the link's href
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.label}
                        href={link.href}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                            isActive
                                ? 'bg-white/10 font-semibold text-white' // Active link style
                                : 'hover:bg-white/10' // Inactive link style
                        }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>

        {/* Sign Out */}
        <div className="px-4 py-6">
          <Link href="/api/auth/signout" className="flex items-center px-4 py-2 rounded-lg hover:bg-white/10 transition-colors duration-200">
            <SignOutIcon />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-100">
        {/* The 'children' prop is where Next.js will render the content of your page.tsx files */}
        {children}
      </main>
    </div>
  );
}
