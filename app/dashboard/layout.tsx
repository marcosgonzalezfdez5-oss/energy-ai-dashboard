'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabaseClient } from '@/lib/supabase';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session) {
          setUserEmail(session.user.email || '');
        } else {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/auth/signin');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabaseClient.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FAF8F4]">
      {/* Sidebar - Fixed 300px width */}
      <div className="w-[300px] bg-white border-r border-[#E5E7EB] flex flex-col shadow-sm">
        {/* Logo and branding */}
        <div className="p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" strokeWidth="2" />
                <path d="M12 1v6m0 6v6m11-11h-6M1 12h6" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-[#111111] text-sm">Solar Operations</h2>
              <p className="text-xs text-[#6B7280]">Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-1">
          <div>
            <h3 className="text-xs font-600 text-[#6B7280] uppercase mb-4 px-3">Navigation</h3>
            <Link
              href="/dashboard"
              className="block px-4 py-2.5 rounded-lg text-[#111111] hover:bg-[#F3F4F6] font-500 transition-colors duration-150"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/plants"
              className="block px-4 py-2.5 rounded-lg text-[#111111] hover:bg-[#F3F4F6] font-500 transition-colors duration-150"
            >
              Plants
            </Link>
            <Link
              href="/dashboard/comparison"
              className="block px-4 py-2.5 rounded-lg text-[#111111] hover:bg-[#F3F4F6] font-500 transition-colors duration-150"
            >
              Plant Comparison
            </Link>
            <Link
              href="/dashboard/chat"
              className="block px-4 py-2.5 rounded-lg text-[#111111] hover:bg-[#F3F4F6] font-500 transition-colors duration-150"
            >
              AI Assistant
            </Link>
          </div>

          <div className="border-t border-[#E5E7EB] pt-4 mt-4">
            <h3 className="text-xs font-600 text-[#6B7280] uppercase mb-4 px-3">Account</h3>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2.5 rounded-lg text-[#111111] hover:bg-red-50 transition-colors duration-150 font-500 text-sm"
            >
              Sign Out
            </button>
          </div>
        </nav>

        {/* User info footer */}
        <div className="border-t border-[#E5E7EB] p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-200 to-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-amber-700">
                {userEmail?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-600 text-[#111111]">Logged in</p>
              <p className="text-xs text-[#6B7280] truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
