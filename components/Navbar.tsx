"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white w-full z-20 sticky top-0 shadow-sm transition-all">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-3 shadow-inner">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-slate-100 hover:text-white transition-colors">
              Intern Hub
            </Link>
          </div>
          <div className="flex items-center space-x-5">
            {session?.user ? (
              <>
                <div className="text-sm flex items-center">
                  <span className="text-slate-400 mr-2">Hello,</span>
                  <span className="font-medium text-slate-200">{session.user.name}</span>
                  <span className="ml-3 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-indigo-300 uppercase tracking-widest shadow-sm">
                    {session.user.role}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-700 mx-2"></div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/" className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center px-4 py-2 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
