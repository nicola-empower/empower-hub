'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setMessage({ text: 'Please enter both email and password.', type: 'error' });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password: trimmedPassword });

    if (error) {
      setMessage({ text: error.message, type: 'error' });
    } else if (data?.user) {
      const user = data.user;
      const { error: clientError } = await supabase
        .from('clients')
        .insert([
          {
            client_id: user.id,
            email: user.email,
            name: user.email?.split('@')[0] || 'New Client',
          },
        ]);

      if (clientError) {
        setMessage({
          text: 'Signup succeeded, but failed to create client record. Please contact support.',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      setMessage({
        text: 'Sign up successful! Please check your email to confirm your account.',
        type: 'success',
      });

      // Optional: Redirect to login after a short delay
      setTimeout(() => router.push('/login'), 2000);
    } else {
      setMessage({
        text: 'Signup failed. Please try again.',
        type: 'error',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Empower Hub</h1>
        <p className="text-gray-600 text-center mb-8">Create your account</p>

        {message && (
          <div
            className={`mb-4 text-center p-3 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="********"
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 text-white font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-semibold text-purple-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}