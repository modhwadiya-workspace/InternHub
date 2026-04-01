"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isValidDepartmentName } from "@/lib/validation";

export default function DepartmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [newDept, setNewDept] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    else if (status === "authenticated" && session.user.role !== "admin") router.push("/dashboard");
    else if (status === "authenticated") fetchDepartments();
  }, [status, session]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) setDepartments(data.departments);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newDept.trim()) return;
    if (!isValidDepartmentName(newDept)) { 
      setError("Department name must be at least 2 characters long."); 
      return; 
    }
    setAdding(true);
    try {
      const res = await fetch("/api/departments/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newDept }) });
      const data = await res.json();
      if (data.department) { 
        setDepartments([...departments, data.department]); 
        setNewDept(""); 
      } else {
        setError(data.error || "Failed to create department");
      }
    } catch (err) { 
      setError("An error occurred during creation");
    } finally { 
      setAdding(false); 
    }
  };

  const confirmedDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/api/departments/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteId }) });
      if (res.ok) {
        setDepartments(departments.filter((d) => d.id !== deleteId));
        setDeleteId(null);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete department");
        setDeleteId(null);
      }
    } catch (err) { 
      setError("An error occurred during deletion");
      setDeleteId(null);
    }
  };

  if (status === "loading" || (status === "authenticated" && session.user.role !== "admin")) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} department{departments.length !== 1 ? "s" : ""} in your organization</p>
        </div>
      </div>

      {/* Add form */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Department
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}
        <form onSubmit={addDepartment} className="flex gap-3">
          <input
            type="text"
            value={newDept}
            onChange={(e) => { setNewDept(e.target.value); setError(""); }}
            placeholder="e.g. Software Engineering"
            className="input-base flex-1"
          />
          <button type="submit" disabled={adding || !newDept.trim()} className="btn btn-primary">
            {adding ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            Add Department
          </button>
        </form>
      </div>

      {/* List */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th style={{ width: 60 }}>#</th>
                <th>Department Name</th>
                <th className="pr-6" style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="py-16 text-center text-slate-400">Loading…</td></tr>
              ) : departments.length === 0 ? (
                <tr><td colSpan={3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    <p className="text-slate-500 font-medium">No departments yet</p>
                    <p className="text-slate-400 text-sm">Add your first department above</p>
                  </div>
                </td></tr>
              ) : (
                departments.map((dept, idx) => (
                  <tr key={dept.id}>
                    <td>
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-800">{dept.name}</span>
                      </div>
                    </td>
                    <td className="pr-6" style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setDeleteId(dept.id)}
                        className="btn btn-danger text-xs px-2.5 py-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Department?</h3>
              <p className="text-sm text-slate-500 mb-6">This action will affect all interns in this department. Experience and historical data may be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="btn btn-secondary flex-1">Cancel</button>
                <button onClick={confirmedDelete} className="btn btn-danger flex-1 bg-red-600 text-white border-0 hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}