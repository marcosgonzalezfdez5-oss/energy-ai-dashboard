'use client';

import Link from 'next/link';

export default function FloatingChatButton() {
  return (
    <Link
      href="/dashboard/chat"
      className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-xl hover:shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 group"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 opacity-20 blur-lg group-hover:opacity-40 transition-opacity"></div>
      
      {/* Icon */}
      <svg
        className="w-7 h-7 relative z-10"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </Link>
  );
}
