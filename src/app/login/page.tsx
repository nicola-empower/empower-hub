// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  // Special admin credentials
  const ADMIN_EMAIL = 'nicola@empowervaservices.co.uk';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
      setLoading(false);
    } else if (data?.user) {
      setMessage({ text: 'Login successful! Redirecting...', type: 'success' });
      // **REDIRECT LOGIC**
      // If the email matches the admin email, go to the admin page.
      // Otherwise, go to the client dashboard.
      const destination = email.toLowerCase() === ADMIN_EMAIL ? '/admin' : '/dashboard';
      router.push(destination);
    } else {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Empower Hub</h1>
        <p className="text-gray-600 text-center mb-8">Welcome back! Please log in.</p>

        {message && (
          <div className={`mb-4 text-center p-3 rounded-lg ${ message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700' }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="you@example.com" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200" placeholder="********" required />
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-3 text-white font-medium bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
         <p className="mt-8 text-center text-sm text-gray-500">
             Invited?{' '}
             <Link href="/signup" className="font-semibold text-purple-600 hover:underline">
                 Set up your account
             </Link>
         </p>
      </div>
    </div>
  );
}