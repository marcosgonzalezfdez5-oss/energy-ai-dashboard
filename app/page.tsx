'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        setIsLoggedIn(!!session);
        if (session) {
          // Redirect to dashboard if already logged in
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left side - Hero section */}
        <div className="flex flex-col justify-center items-start px-8 md:px-16 py-12 md:py-0">
          <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mb-8">
            <svg
              className="w-10 h-10 text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="6" />
              <path d="M12 2v4m0 12v4M22 12h-4M4 12H0" stroke="currentColor" strokeWidth="2" />
              <path d="M19.07 4.93l-2.83 2.83m-8.48 8.48l-2.83 2.83M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
            Solar Operations
            <br />
            <span className="text-primary">Intelligence</span>
          </h1>

          <p className="text-lg text-gray-700 mb-8 max-w-md leading-relaxed">
            Monitor, analyze, and optimize your solar energy portfolio with AI-powered insights.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <div className="px-4 py-2 bg-yellow-100 text-gray-700 rounded-full text-sm font-medium">
              Real-time monitoring
            </div>
            <div className="px-4 py-2 bg-yellow-100 text-gray-700 rounded-full text-sm font-medium">
              AI analytics
            </div>
            <div className="px-4 py-2 bg-yellow-100 text-gray-700 rounded-full text-sm font-medium">
              Financial reports
            </div>
            <div className="px-4 py-2 bg-yellow-100 text-gray-700 rounded-full text-sm font-medium">
              Multi-plant
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="flex items-center justify-center px-8 md:px-16 py-12 md:py-0 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-2">Sign in</h2>
              <p className="text-gray-600 mb-6">Access your solar operations dashboard</p>

              <div className="flex flex-col gap-4">
                <Link
                  href="/auth/signin"
                  className="w-full bg-primary text-white font-semibold py-3 rounded-lg hover:bg-opacity-90 transition text-center"
                >
                  Sign in with Email
                </Link>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Don&apos;t have an account?</span>
                  </div>
                </div>

                <Link
                  href="/auth/signup"
                  className="w-full bg-gray-100 text-black font-semibold py-3 rounded-lg hover:bg-gray-200 transition text-center border border-gray-300"
                >
                  Create an account
                </Link>
              </div>

              <p className="text-xs text-gray-500 mt-6 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
