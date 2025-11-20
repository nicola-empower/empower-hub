// src/app/nicola/layout.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Importing the new icons needed
import { FaUserCog, FaTachometerAlt, FaBrain, FaUtensils, FaShoppingCart, FaBroom, FaMagic, FaClipboardList } from 'react-icons/fa';

export default function NicolaLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navLinks = [
        { href: "/nicola/dashboard", label: "Dashboard", icon: FaTachometerAlt },
        // Added the BRAIN link to the navigation
        { href: "/nicola/brain", label: "B.R.A.I.N.", icon: FaBrain },
        { href: "/nicola/journal", label: "Journal", icon: FaBrain },
        { href: "/nicola/journal/meal-planner", label: "Meal Planner", icon: FaUtensils },
        { href: "/nicola/journal/shopping-list", label: "Shopping List", icon: FaShoppingCart },
        { href: "/nicola/journal/housework-tracker", label: "Housework", icon: FaBroom },
        { href: "/nicola/smart-summariser", label: "Smart Summariser" },
    ];

    const workLinks = [
        { href: "/my-hub", label: "My Hub", icon: FaUserCog },
        { href: "/admin", label: "Admin Dashboard", icon: FaTachometerAlt },
        // Added the Social Genie link to the work section
        { href: "/nicola/social-genie", label: "Social Genie", icon: FaMagic },
        // Added a placeholder for the Planarchy link in the future
        { href: "/nicola/planarchy", label: "Planarchy", icon: FaClipboardList },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-800 md:flex-row">
            <aside className="w-full md:w-64 bg-violet-800 text-white shadow-xl p-4 flex flex-col md:flex-shrink-0">
                <div className="flex-grow">
                    <h2 className="text-2xl font-bold mb-6 text-center">Nicola</h2>
                    <nav>
                        <ul className="space-y-2">
                            {navLinks.map(link => {
                                const isActive = pathname.startsWith(link.href);
                                return (
                                    <li key={link.label}>
                                        <Link href={link.href} className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                                            isActive ? 'bg-violet-900 font-semibold' : 'hover:bg-violet-700'
                                        }`}>
                                            {link.icon && <link.icon className="w-5 h-5" />}
                                            {link.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                <div className="mt-6 pt-4 border-t border-violet-700">
                    <h3 className="text-xl font-bold mb-4 text-center">Empower Hub</h3>
                     <ul className="space-y-2">
                         {workLinks.map(link => {
                             const isActive = pathname.startsWith(link.href);
                             return (
                                 <li key={link.label}>
                                     <Link href={link.href} className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                                         isActive ? 'bg-violet-900 font-semibold' : 'hover:bg-violet-700'
                                     }`}>
                                         {link.icon && <link.icon className="w-5 h-5" />}
                                         {link.label}
                                     </Link>
                                 </li>
                             );
                         })}
                    </ul>
                </div>
            </aside>

            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
