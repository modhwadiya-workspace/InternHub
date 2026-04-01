"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

interface Leave {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
  };
  start_date: string;
  end_date: string;
  reason: string;
  leave_type: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface LeaveListProps {
  leaves: Leave[];
  onUpdate: () => void;
}

export default function LeaveList({ leaves, onUpdate }: LeaveListProps) {
  const { data: session } = useSession();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Update failed");
      onUpdate();
    } catch (err) {
      alert("Error updating status");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusStyles = {
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-400",
      label: "Pending Review"
    },
    approved: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-400",
      label: "Approved"
    },
    rejected: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      dot: "bg-red-400",
      label: "Rejected"
    }
  };

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-transform duration-500">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-slate-400 font-semibold text-lg tracking-tight">No leave requests to show</p>
        <p className="text-slate-400 text-sm mt-1">New applications will appear here once submitted.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {leaves.map((leave) => {
        const style = statusStyles[leave.status];
        return (
          <div 
            key={leave.id} 
            className="group relative bg-white border border-slate-200/60 rounded-[2rem] p-4 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100"
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Column: User & Status */}
              <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 md:w-48 lg:w-56 shrink-0 md:border-r border-slate-100 md:pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-500">
                    {leave.user?.name?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{leave.user?.name || "My Request"}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(leave.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className={`mt-0 md:mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
                  <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{style.label}</span>
                </div>
              </div>

              {/* Middle Column: Leave Details */}
              <div className="flex-1 space-y-5">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-between">
                  <div className="grid grid-cols-2 gap-8 w-full sm:w-auto">
                    <div className="relative group/date">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Start Date
                      </p>
                      <p className="text-sm font-bold text-slate-800">{new Date(leave.start_date).toLocaleDateString()}</p>
                    </div>
                    <div className="relative group/date">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        End Date
                      </p>
                      <p className="text-sm font-bold text-slate-800">{new Date(leave.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg shadow-sm w-full sm:w-auto text-center">
                    {leave.leave_type}
                  </span>
                </div>

                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Reason for Leave</p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                    "{leave.reason}"
                  </p>
                </div>
              </div>

              {/* Right Column: Actions */}
              {session?.user.role !== "intern" && leave.status === "pending" && (
                <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <button
                    disabled={updatingId === leave.id}
                    onClick={() => handleUpdateStatus(leave.id, "approved")}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Approve
                  </button>
                  <button
                    disabled={updatingId === leave.id}
                    onClick={() => handleUpdateStatus(leave.id, "rejected")}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-red-50 active:scale-95 text-red-600 border border-red-100 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
