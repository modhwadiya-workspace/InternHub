import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { gql } from "@/lib/hasura";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const role = session.user.role;

  if (role === "intern" ) {
    redirect("/profile");
  }

  if(role === "manager"){
    redirect("/interns");
  }

  // Fetch aggregate data
  const query = `query {
    interns: users_aggregate(where: {role: {_eq: "intern"}}) {
      aggregate { count }
    }
    departments: departments_aggregate {
      aggregate { count }
    }
    managers: users_aggregate(where: {role: {_eq: "manager"}}) {
      aggregate { count }
    }
  }`;

  const res = await gql(query);
  const internCount = res.data?.interns?.aggregate?.count || 0;
  const deptCount = res.data?.departments?.aggregate?.count || 0;
  const managerCount = res.data?.managers?.aggregate?.count || 0;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h3 className="text-2xl font-bold leading-6 text-slate-900">Dashboard Overview</h3>
        <p className="mt-2 max-w-4xl text-sm text-slate-500">
          Welcome back, {session.user.name}. Here's what's happening today.
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-xl border border-slate-100 overflow-hidden">
          <dt>
            <div className="absolute bg-indigo-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="ml-16 text-sm font-medium text-slate-500 truncate">Total Interns</p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-slate-900">{internCount}</p>
          </dd>
        </div>

        <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-xl border border-slate-100 overflow-hidden">
          <dt>
            <div className="absolute bg-purple-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="ml-16 text-sm font-medium text-slate-500 truncate">Departments</p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-slate-900">{deptCount}</p>
          </dd>
        </div>

        <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-sm rounded-xl border border-slate-100 overflow-hidden">
          <dt>
            <div className="absolute bg-emerald-500 rounded-md p-3">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="ml-16 text-sm font-medium text-slate-500 truncate">Managers</p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-slate-900">{managerCount}</p>
          </dd>
        </div>
      </dl>
    </div>
  );
}