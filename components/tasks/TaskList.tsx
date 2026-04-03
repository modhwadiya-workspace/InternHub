"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date?: string;
  group_id?: string;
  completed_at?: string;
  assigned_to_user?: {
    id: string;
    name: string;
    email: string;
  };
  created_by_user?: {
    name: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  onUpdate: () => void;
  onViewDetails: (tasks: Task[]) => void;
  onEdit: (task: Task, groupTasks?: Task[]) => void;
  onDelete?: (id: string, groupId?: string) => void;
}

export default function TaskList({ tasks, onUpdate, onViewDetails, onEdit, onDelete }: TaskListProps) {
  const { data: session } = useSession();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Update failed");
      onUpdate();
    } catch (err) {
      alert("Error updating task status");
    } finally {
      setUpdatingId(null);
    }
  };

  const priorityStyles = {
    low: "text-slate-500 bg-slate-100",
    medium: "text-amber-600 bg-amber-50",
    high: "text-red-600 bg-red-50",
  };

  const statusStyles = {
    todo: "bg-slate-100 text-slate-600",
    in_progress: "bg-indigo-50 text-indigo-600",
    completed: "bg-emerald-50 text-emerald-600",
  };

  // Grouping logic for Admin/Manager
  const isAdmin = session?.user.role === "admin" || session?.user.role === "manager";
  
  const displayTasks = isAdmin ? (() => {
    const groups: Record<string, Task[]> = {};
    const singles: Task[] = [];

    tasks.forEach(task => {
      if (task.group_id) {
        if (!groups[task.group_id]) groups[task.group_id] = [];
        groups[task.group_id].push(task);
      } else {
        singles.push(task);
      }
    });

    const groupedArray = Object.values(groups).map(groupTasks => ({
      ...groupTasks[0],
      isGroup: true,
      allInternTasks: groupTasks
    }));

    return [...singles, ...groupedArray].sort((a, b) => b.id.localeCompare(a.id));
  })() : tasks;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium tracking-tight">No tasks available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayTasks.map((t: any) => {
        const task = t;
        const isGroup = task.isGroup;
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
        
        return (
          <div 
            key={task.id} 
            className={`group block bg-white border border-slate-100 rounded-[1.5rem] p-6 transition-all duration-300 hover:shadow-xl hover:border-slate-200 ${isGroup ? 'ring-2 ring-indigo-50 border-indigo-100' : ''}`}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className={`text-base font-bold ${!isGroup && task.status === "completed" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                    {task.title}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${priorityStyles[task.priority as keyof typeof priorityStyles]}`}>
                    {task.priority}
                  </span>
                  {!isGroup && (
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusStyles[task.status as keyof typeof statusStyles]}`}>
                      {task.status.replace("_", " ")}
                    </span>
                  )}
                  {isGroup && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100">
                      BULK GROUP ({task.allInternTasks.length})
                    </span>
                  )}
                </div>
                
                {task.description && (
                  <p className="text-sm text-slate-500 font-medium line-clamp-2 max-w-2xl">{task.description}</p>
                )}

                <div className="flex items-center gap-6 pt-2">
                  {!isGroup && task.assigned_to_user && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                        {task.assigned_to_user.name.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-600">{task.assigned_to_user.name}</span>
                    </div>
                  )}
                  {isGroup && (
                    <div className="flex -space-x-2">
                       {task.allInternTasks.slice(0, 3).map((it: any) => (
                         <div key={it.id} className="w-7 h-7 rounded-lg bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm" title={it.assigned_to_user?.name}>
                            {it.assigned_to_user?.name?.charAt(0)}
                         </div>
                       ))}
                       {task.allInternTasks.length > 3 && (
                         <div className="w-7 h-7 rounded-lg bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">
                            +{task.allInternTasks.length - 3}
                         </div>
                       )}
                    </div>
                  )}
                  {task.due_date && (
                    <div className={`flex items-center gap-2 text-xs font-bold ${isOverdue ? "text-red-500" : "text-slate-400"}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button 
                    onClick={() => onEdit(task, isGroup ? task.allInternTasks : undefined)}
                    className="h-10 w-10 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 shadow-sm"
                    title="Edit Task"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                )}
                {isAdmin && onDelete && (
                  deletingId === task.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { onDelete(task.id, isGroup ? task.group_id : undefined); setDeletingId(null); }}
                        className="h-10 px-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-red-700 transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="h-10 px-3 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(task.id)}
                      className="h-10 w-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 shadow-sm"
                      title="Delete Task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )
                )}

                {isAdmin && isGroup && (
                  <button 
                    onClick={() => onViewDetails(task.allInternTasks)}
                    className="h-10 px-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                  >
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                )}

                {session?.user.role === "intern" && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="relative group/select">
                      <select
                        disabled={updatingId === task.id}
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className={`
                          appearance-none cursor-pointer pl-4 pr-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/50 shadow-sm
                          ${statusStyles[task.status as keyof typeof statusStyles]}
                        `}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
