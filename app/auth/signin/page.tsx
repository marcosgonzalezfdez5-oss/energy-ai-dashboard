'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('operator.company_1@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F4] to-[#FEF5EB] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Header with logo */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg
              className="w-8 h-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5" strokeWidth="2" />
              <path d="M12 1v6m0 6v6m11-11h-6M1 12h6" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111111] mb-1">Sign in</h1>
          <p className="text-[#6B7280]">Access your solar operations dashboard</p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-600 text-[#111111] mb-2">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl bg-white text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-600 text-[#111111] mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl bg-white text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] focus:ring-2 focus:ring-amber-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#F59E0B] hover:bg-[#EA9200] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Signup link */}
          <div className="mt-6 text-center">
            <p className="text-[#6B7280]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[#F59E0B] hover:text-[#EA9200] font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Demo info card */}
        <div className="bg-white border-2 border-[#E5E7EB] rounded-xl p-4 text-sm">
          <p className="font-600 text-[#111111] mb-2">Demo credentials:</p>
          <p className="text-[#6B7280] text-xs mb-1">Email: <span className="font-mono text-[#111111]">operator.company_1@example.com</span></p>
          <p className="text-[#6B7280] text-xs">Password: <span className="font-mono text-[#111111]">password123</span></p>
        </div>
      </div>
    </div>
  );
}
