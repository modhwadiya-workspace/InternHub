import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { gql } from "@/lib/hasura";
import Link from "next/link";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  shadow: string;
  href: string;
  description: string;
}

function StatCard({ title, value, icon, gradient, shadow, href, description }: StatCardProps) {
  return (
    <Link href={href} className="block group">
      <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} ${shadow} transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white" />
          <div className="absolute -right-2 top-8 w-16 h-16 rounded-full bg-white" />
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-white/75 text-sm font-medium mb-1">{title}</p>
            <p className="text-4xl font-extrabold tracking-tight mb-1">{value}</p>
            <p className="text-white/60 text-xs font-medium">{description}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-1 ring-white/30">
            {icon}
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-1 text-white/75 text-xs font-medium group-hover:text-white transition-colors">
          <span>View all</span>
          <svg className="w-3.5 h-3.5 mt-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  const role = session.user.role;
  if (role === "intern") redirect("/profile");
  if (role === "manager") redirect("/interns");

  const query = `query {
    interns: users_aggregate(where: {role: {_eq: "intern"}}) { aggregate { count } }
    departments: departments_aggregate { aggregate { count } }
    managers: users_aggregate(where: {role: {_eq: "manager"}}) { aggregate { count } }
  }`;
  const res = await gql(query, {}, session.hasuraToken as string);
  const internCount = res.data?.interns?.aggregate?.count || 0;
  const deptCount = res.data?.departments?.aggregate?.count || 0;
  const managerCount = res.data?.managers?.aggregate?.count || 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="page-title">Dashboard Overview</h1>
        <p className="page-subtitle mt-1">Welcome back! Here's what's happening with your organization.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Interns"
          value={internCount}
          href="/interns"
          description="Active & inactive interns"
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          shadow="shadow-lg shadow-indigo-500/25"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Departments"
          value={deptCount}
          href="/departments"
          description="Organizational units"
          gradient="bg-gradient-to-br from-violet-500 to-violet-700"
          shadow="shadow-lg shadow-violet-500/25"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          title="Managers"
          value={managerCount}
          href="/managers"
          description="Team leads & supervisors"
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          shadow="shadow-lg shadow-emerald-500/25"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Intern", href: "/add/interns", emoji: "👤", color: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100" },
            { label: "View Departments", href: "/departments", emoji: "🏢", color: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-100" },
            { label: "Announcements", href: "/announcements", emoji: "📣", color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100" },
            { label: "Manage Managers", href: "/managers", emoji: "💼", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border font-medium text-sm transition-all duration-150 ${action.color}`}
            >
              <span className="text-2xl">{action.emoji}</span>
              <span className="text-center text-xs font-semibold">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}