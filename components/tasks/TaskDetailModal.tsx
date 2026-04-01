"use client";

import { Task } from "./TaskList";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

export default function TaskDetailModal({ isOpen, onClose, tasks }: TaskDetailModalProps) {
  if (!isOpen || tasks.length === 0) return null;

  const mainTask = tasks[0];

  const statusStyles = {
    todo: "badge-slate",
    in_progress: "badge-indigo",
    completed: "badge-success",
  };

  const getStatusText = (status: string) => {
    return status.replace("_", " ");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card !max-w-3xl overflow-visible">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Task Details</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Progress breakdown for all interns</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[calc(85vh-82px)] overflow-y-auto custom-scrollbar">
          {/* Main Info */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 space-y-4">
             <div className="space-y-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Task Title</span>
                <h3 className="text-lg font-bold text-slate-800">{mainTask.title}</h3>
             </div>
             {mainTask.description && (
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</span>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed">{mainTask.description}</p>
                </div>
             )}
             <div className="flex gap-8 pt-2">
                <div className="space-y-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</span>
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${mainTask.priority === 'high' ? 'bg-red-500' : mainTask.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-700 capitalize">{mainTask.priority}</span>
                   </div>
                </div>
                {mainTask.due_date && (
                   <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</span>
                      <p className="text-xs font-bold text-slate-700">{new Date(mainTask.due_date).toLocaleDateString()}</p>
                   </div>
                )}
             </div>
          </div>

          {/* Interns List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
               <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Assigned Interns ({tasks.length})</h4>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-500" />
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                  </div>
               </div>
            </div>

            <div className="table-container !border-none !shadow-none">
              <table className="table-base">
                <thead>
                  <tr>
                    <th className="!bg-white">Intern</th>
                    <th className="!bg-white">Status</th>
                    <th className="!bg-white">Completed On</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">
                             {task.assigned_to_user?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{task.assigned_to_user?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{task.assigned_to_user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusStyles[task.status as keyof typeof statusStyles]}`}>
                          {getStatusText(task.status)}
                        </span>
                      </td>
                      <td>
                        {task.completed_at ? (
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-slate-700">
                                {new Date(task.completed_at).toLocaleDateString()}
                             </span>
                             <span className="text-[9px] text-slate-400 font-medium">
                                {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-medium italic">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
           <button
             onClick={onClose}
             className="btn btn-secondary w-full !h-12 !rounded-xl font-bold uppercase tracking-widest text-[11px]"
           >
             Close Details
           </button>
        </div>
      </div>
    </div>
  );
}
