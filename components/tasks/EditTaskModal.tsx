import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Task } from "./TaskList";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
  allInternsForGroup?: Task[]; // If it's a group, we pass all tasks in that group
}

interface User {
  id: string;
  name: string;
  role: string;
  department_id?: number;
}

export default function EditTaskModal({ isOpen, onClose, onSuccess, task, allInternsForGroup }: EditTaskModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interns, setInterns] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: "",
    assigned_to: [] as string[],
    all_interns: false,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchInterns();
      if (task) {
        // If it's a group, we collect all intern IDs from allInternsForGroup
        const assignedIds = allInternsForGroup 
          ? allInternsForGroup.map(t => t.assigned_to_user?.id).filter(id => !!id) as string[]
          : [task.assigned_to_user?.id].filter(id => !!id) as string[];

        setFormData({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : "",
          assigned_to: assignedIds,
          all_interns: false,
        });
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, task, allInternsForGroup]);

  const fetchInterns = async () => {
    try {
      const res = await fetch("/api/users?role=intern");
      const data = await res.json();
      if (res.ok) setInterns(data.users);
    } catch (err) {
      console.error("Error fetching interns:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          group_id: task.group_id,
          ...formData
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleIntern = (id: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(id)
        ? prev.assigned_to.filter(i => i !== id)
        : [...prev.assigned_to, id],
      all_interns: false // Turn off "all" if someone is manually toggled
    }));
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      // Filter interns by department if manager
      const relevantInterns = session?.user.role === 'admin' 
        ? interns 
        : interns.filter(i => i.department_id === session?.user.department_id);
      
      setFormData(prev => ({ 
        ...prev, 
        all_interns: true, 
        assigned_to: relevantInterns.map(i => i.id) 
      }));
    } else {
      setFormData(prev => ({ ...prev, all_interns: false, assigned_to: [] }));
    }
  };

  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen || !task) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card !max-w-3xl overflow-visible">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Task</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Update details and manage assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[calc(90vh-80px)] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                   </div>
                   <input
                     required
                     type="text"
                     placeholder="e.g. Database Optimization"
                     className="input-field !pl-12"
                     value={formData.title}
                     onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p as any })}
                      className={`
                        py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all
                        ${formData.priority === p 
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}
                      `}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <input
                     type="date"
                     className="input-field !pl-12"
                     value={formData.due_date}
                     onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                   />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  placeholder="Provide task details..."
                  className="input-field min-h-[120px] py-4 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column: Assignments */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Assign Interns</label>
                   
                   <label className="flex items-center gap-3 cursor-pointer group">
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest italic">
                         Select All
                      </span>
                      <div className="relative">
                         <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.all_interns}
                            onChange={(e) => handleToggleAll(e.target.checked)}
                         />
                         <div className={`w-10 h-5 rounded-full transition-colors duration-300 ${formData.all_interns ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                         <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${formData.all_interns ? 'translate-x-5' : ''}`} />
                      </div>
                   </label>
                </div>
                
                <div className="relative">
                  {/* Search Input */}
                  <div className="relative group/search">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search to add or change interns..."
                      className="input-field !pl-12 !h-14 bg-slate-50/30 border-dashed border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                    />
                  </div>

                  {/* Selected Tags */}
                  {formData.assigned_to.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      {formData.assigned_to.map(id => {
                        const intern = interns.find(i => i.id === id);
                        return (
                          <div key={id} className="badge-indigo !py-1.5 !pl-3 !pr-2 flex items-center gap-2 group/tag animate-in zoom-in-95">
                            <span className="text-[10px] font-black">{intern?.name || 'Loading...'}</span>
                            <button 
                              type="button" 
                              onClick={() => toggleIntern(id)}
                              className="p-1 hover:bg-indigo-600 rounded-lg transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dropdown List */}
                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                      <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                          {filteredInterns.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">No matching interns found</div>
                          ) : (
                            filteredInterns.map(i => (
                              <button
                                key={i.id}
                                type="button"
                                onClick={() => toggleIntern(i.id)}
                                className={`w-full px-6 py-4 flex items-center justify-between transition-all hover:bg-slate-50 ${formData.assigned_to.includes(i.id) ? 'bg-indigo-50/30' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm">
                                    {i.name.charAt(0)}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-xs font-bold text-slate-800 tracking-tight">{i.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intern</p>
                                  </div>
                                </div>
                                {formData.assigned_to.includes(i.id) && (
                                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  </div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading || formData.assigned_to.length === 0}
              className="btn-primary flex-1 !h-14 !rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Updating Task...
                </div>
              ) : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary !h-14 !px-8 !rounded-2xl font-black text-[11px] uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
