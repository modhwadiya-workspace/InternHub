"use client";

import { useState, useEffect } from "react";
import { gql } from "@/lib/hasura";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTaskModal({ isOpen, onClose, onSuccess }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [interns, setInterns] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: [] as string[],
    priority: "medium",
    due_date: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchInterns();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const fetchInterns = async () => {
    try {
      const res = await fetch("/api/users?role=intern");
      const data = await res.json();
      setInterns(data.users || []);
    } catch (err) {
      console.error("Failed to fetch interns", err);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, assigned_to: interns.map(i => i.id) });
    } else {
      setFormData({ ...formData, assigned_to: [] });
    }
  };

  const toggleIntern = (id: string) => {
    setFormData(prev => {
      const isSelected = prev.assigned_to.includes(id);
      if (isSelected) {
        return { ...prev, assigned_to: prev.assigned_to.filter(i => i !== id) };
      } else {
        return { ...prev, assigned_to: [...prev.assigned_to, id] };
      }
    });
  };

  const filteredInterns = interns.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.assigned_to.length === 0) {
      setError("Please select at least one intern.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      setFormData({ title: "", description: "", assigned_to: [], priority: "medium", due_date: "" });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isAllSelected = interns.length > 0 && formData.assigned_to.length === interns.length;

  return (
    <div className="modal-overlay">
      <div className="modal-card !max-w-2xl overflow-visible">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
             </div>
             <div>
               <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assign Task</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Create tasks for your interns</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[calc(90vh-80px)] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Task Title</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <input
                type="text"
                required
                placeholder="What needs to be done?"
                className="input-field input-with-icon font-semibold text-slate-700"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Task Description</label>
            <div className="relative group">
              <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              </div>
              <textarea
                rows={3}
                placeholder="Add some details about the task..."
                className="input-field !pl-11 pt-3.5 resize-none font-medium text-slate-600"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Assign Interns</label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:shadow-sm after:transition-all peer-checked:after:translate-x-3.5"></div>
                </div>
                <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-wider">Select All</span>
              </label>
            </div>

            <div className="relative">
              <div 
                className={`min-h-[3rem] w-full bg-white border-1.5 rounded-xl px-3 py-2 cursor-pointer transition-all flex flex-wrap gap-2 items-center ${isDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {formData.assigned_to.length === 0 ? (
                  <span className="text-slate-400 text-sm font-medium ml-2">Choose interns...</span>
                ) : (
                  formData.assigned_to.map(id => {
                    const intern = interns.find(i => i.id === id);
                    return (
                      <span key={id} className="badge badge-indigo border border-indigo-100 flex items-center gap-1.5 animate-in zoom-in-95 leading-none h-6">
                        {intern?.name}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleIntern(id); }}
                          className="hover:text-indigo-800 transition-colors"
                        >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </span>
                    );
                  })
                )}
                <div className="ml-auto text-slate-400 pr-1">
                   <svg className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Quick find..."
                      className="w-full h-9 pl-9 pr-4 bg-slate-50 border-none rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 font-semibold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {filteredInterns.map(intern => (
                      <div 
                        key={intern.id}
                        className={`group/item flex items-center justify-between p-2 rounded-xl cursor-not-allowed transition-all mb-1 ${formData.assigned_to.includes(intern.id) ? 'bg-indigo-50' : 'hover:bg-slate-50 cursor-pointer'}`}
                        onClick={(e) => { e.stopPropagation(); toggleIntern(intern.id); }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${formData.assigned_to.includes(intern.id) ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-400 group-hover/item:text-indigo-500 group-hover/item:border-indigo-100'}`}>
                            {intern.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-700">{intern.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium">{intern.email}</p>
                          </div>
                        </div>
                        {formData.assigned_to.includes(intern.id) && (
                          <div className="mr-1 text-indigo-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredInterns.length === 0 && (
                      <div className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No interns available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-2">
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <select
                  className="input-field input-with-icon cursor-pointer appearance-none pr-10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Due Date</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                </div>
                <input
                  type="date"
                  min={todayStr}
                  className="input-field input-with-icon"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-50 pt-8 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 !h-12 !rounded-xl font-bold uppercase tracking-widest text-[11px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 !h-12 !rounded-xl font-bold uppercase tracking-widest text-[11px] !bg-slate-900"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Launch Task</span>
              )}
            </button>
          </div>
        </form>
      </div>
      {isDropdownOpen && <div className="fixed inset-0 z-[140]" onClick={() => setIsDropdownOpen(false)} />}
    </div>
  );
}
