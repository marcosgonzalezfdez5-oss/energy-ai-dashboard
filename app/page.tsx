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
    <div className="min-h-screen bg-gradient-to-br from-[#FAF8F4] to-[#FEF5EB]">
      <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] min-h-screen">
        {/* Left side - Hero section with subtle radial glow */}
        <div className="relative flex flex-col justify-center items-start px-8 md:px-16 py-16 md:py-0 overflow-hidden">
          {/* Subtle radial glow effect */}
          <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200 to-transparent rounded-full opacity-20 blur-3xl"></div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-3xl flex items-center justify-center mb-12 shadow-lg">
              <svg
                className="w-12 h-12 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="5" strokeWidth="2" />
                <path d="M12 1v6m0 6v6m11-11h-6M1 12h6" strokeWidth="2" strokeLinecap="round" />
                <path d="M20.5 3.5l-4.2 4.2m-8.6 8.6l-4.2 4.2M3.5 3.5l4.2 4.2m8.6 8.6l4.2 4.2" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Main heading with hierarchy */}
            <h1 className="text-6xl md:text-7xl font-bold text-[#111111] mb-3 leading-tight">
              Solar Operations
            </h1>
            <h1 className="text-6xl md:text-7xl font-bold text-[#F59E0B] mb-8 leading-tight">
              Intelligence
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-[#6B7280] mb-10 max-w-lg leading-relaxed font-500">
              Monitor, analyze, and optimize your solar energy portfolio with AI-powered insights.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3 mb-16">
              {['Real-time monitoring', 'AI analytics', 'Financial reports', 'Multi-plant management'].map((feature) => (
                <div
                  key={feature}
                  className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-[#111111] rounded-full text-sm font-500 shadow-sm hover:shadow-md transition-shadow"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Sign in form */}
        <div className="flex items-center justify-center px-8 md:px-12 py-16 md:py-0 bg-white">
          <div className="w-full max-w-sm">
            <div className="space-y-8">
              {/* Form header */}
              <div>
                <h2 className="text-3xl font-bold text-[#111111] mb-2">Sign in</h2>
                <p className="text-[#6B7280]">Access your solar operations dashboard</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/signin"
                  className="w-full bg-[#F59E0B] hover:bg-[#EA9200] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 text-center shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Sign in with Email
                </Link>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E5E7EB]"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-[#6B7280]">or</span>
                  </div>
                </div>

                <Link
                  href="/auth/signup"
                  className="w-full bg-white hover:bg-[#F9F7F3] text-[#111111] font-semibold py-3.5 rounded-xl border-2 border-[#E5E7EB] transition-all duration-200 text-center hover:border-[#F59E0B]"
                >
                  Create an account
                </Link>
              </div>

              {/* Terms text */}
              <p className="text-xs text-[#6B7280] text-center">
                By signing in, you agree to our{' '}
                <span className="text-[#111111] font-600">Terms of Service</span> and{' '}
                <span className="text-[#111111] font-600">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
