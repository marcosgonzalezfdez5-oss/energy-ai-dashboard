'use client'

import { usePathname, useRouter } from "next/navigation";

export default function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/chat") return null;

  return (
    <button
      onClick={() => router.push("/chat")}
      className="fixed bottom-6 right-6 w-16 h-16 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-zinc-950 transition-all hover:scale-105 z-50"
      style={{ boxShadow: "0 8px 24px rgba(245,158,11,.40)" }}
      aria-label="Open AI assistant"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>
  );
}
