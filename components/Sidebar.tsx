"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

type NavItem = { name: string; href: string; icon: React.ReactNode };

const ICON = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  departments: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  addUser: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  announcement: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  profile: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  leaves: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
    </svg>
  ),
  tasks: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) return null;
  const role = session.user.role;

  const links: NavItem[] = [];

  if (role === "admin") {
    links.push(
      { name: "Dashboard", href: "/dashboard", icon: ICON.dashboard },
      { name: "Departments", href: "/departments", icon: ICON.departments },
      { name: "Interns", href: "/interns", icon: ICON.users },
      { name: "Managers", href: "/managers", icon: ICON.users },
      { name: "Add Member", href: "/add/interns", icon: ICON.addUser },
      { name: "Leaves", href: "/leaves", icon: ICON.leaves },
      { name: "Tasks", href: "/tasks", icon: ICON.tasks },
      { name: "Announcements", href: "/announcements", icon: ICON.announcement },
      { name: "Data Chat", href: "/chat", icon: ICON.chat },
    );
  } else if (role === "manager") {
    links.push(
      { name: "My Interns", href: "/interns", icon: ICON.users },
      { name: "Add Intern", href: "/add/interns", icon: ICON.addUser },
      { name: "Leaves", href: "/leaves", icon: ICON.leaves },
      { name: "Tasks", href: "/tasks", icon: ICON.tasks },
      { name: "Announcements", href: "/announcements", icon: ICON.announcement },
    );
  } else if (role === "intern") {
    links.push(
      { name: "My Profile", href: "/profile", icon: ICON.profile },
      { name: "Leaves", href: "/leaves", icon: ICON.leaves },
      { name: "Tasks", href: "/tasks", icon: ICON.tasks },
      { name: "Announcements", href: "/announcements", icon: ICON.announcement },
    );
  }

  const roleLabel: Record<string, string> = {
    admin: "Administrator",
    manager: "Manager",
    intern: "Intern",
  };

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      {/* Nav section */}
      <nav className="flex-1 p-3 pt-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-3 mb-3">Navigation</p>
        <ul className="space-y-0.5">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                    }`}
                  >
                    {link.icon}
                  </span>
                  {link.name}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info at bottom */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session.user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{session.user.name}</p>
            <p className="text-[11px] text-slate-500 leading-tight capitalize">{roleLabel[role || ""] || role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
