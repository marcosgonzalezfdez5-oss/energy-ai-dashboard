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
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 sidebar flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="6" />
                <path d="M12 2v4m0 12v4M22 12h-4M4 12H0" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-black">Solar Ops</h1>
              <p className="text-xs text-gray-600">Intelligence Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Navigation</h3>
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded text-gray-700 hover:bg-yellow-50 transition"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/plants"
              className="block px-3 py-2 rounded text-gray-700 hover:bg-yellow-50 transition"
            >
              Plants
            </Link>
            <Link
              href="/dashboard/comparison"
              className="block px-3 py-2 rounded text-gray-700 hover:bg-yellow-50 transition"
            >
              Plant Comparison
            </Link>
            <Link
              href="/dashboard/chat"
              className="block px-3 py-2 rounded text-gray-700 hover:bg-yellow-50 transition"
            >
              AI Assistant
            </Link>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-xs font-semibold text-gray-600 uppercase mb-3">Account</h3>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded text-gray-700 hover:bg-red-50 transition text-sm"
            >
              Sign Out
            </button>
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-600 truncate">
            <p className="font-medium">Logged in as:</p>
            <p className="truncate text-gray-500">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
}
