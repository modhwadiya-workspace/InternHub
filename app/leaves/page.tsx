"use client";

import { useEffect, useState } from "react";
import LeaveRequestForm from "@/components/leaves/LeaveRequestForm";
import LeaveList from "@/components/leaves/LeaveList";
import { useSession } from "next-auth/react";

export default function LeavesPage() {
  const { data: session } = useSession();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaves");
      const data = await res.json();
      setLeaves(data.leaves || []);
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchLeaves();
    }
  }, [session]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 px-4 pb-20">
      <header className="relative py-4">
        <div className="absolute -left-4 top-0 w-1 h-12 bg-indigo-600 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leave Management</h1>
        <p className="text-slate-500 mt-2 font-semibold">Track, request, and manage leave applications seamlessly.</p>
      </header>

      <div className="flex flex-col gap-16">
        {session?.user.role === "intern" && (
          <section className="relative">
            <div className="absolute inset-0 bg-indigo-50/50 rounded-[3rem] -m-8 -z-10" />
            <div className="max-w-2xl mx-auto w-full">
              <div className="mb-8 text-center">
                <h2 className="text-xl font-bold text-slate-800">New Application</h2>
                <p className="text-sm text-slate-500 font-medium">Fill in the details below to request a leave.</p>
              </div>
              <LeaveRequestForm onSuccess={fetchLeaves} />
            </div>
          </section>
        )}
        
        <div className="w-full">
          <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-2 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">
                  {session?.user.role === "intern" ? "My History" : "Pending Applications"}
              </h2>
          </div>
          
          {loading ? (
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 w-full bg-slate-50 rounded-[2.5rem] animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
              <LeaveList leaves={leaves} onUpdate={fetchLeaves} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
