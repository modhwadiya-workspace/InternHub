"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateUserUpdate } from "@/lib/validation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setManagersSearch, setManagersDepartment, setManagersGender } from "@/lib/redux/slices/managersFilterSlice";

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-indigo-400 to-indigo-600", "from-violet-400 to-violet-600", "from-sky-400 to-sky-600", "from-emerald-400 to-emerald-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const managersFilter = useAppSelector((state) => state.managersFilter);

  const [managers, setManagers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    else if (status === "authenticated" && session.user.role !== "admin") router.push("/dashboard");
    else if (status === "authenticated") { fetchDepartments(); fetchManagers(); }
  }, [status, session, managersFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) setDepartments(data.departments);
    } catch (err) { console.error(err); }
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (managersFilter.search) params.append("search", managersFilter.search);
      if (managersFilter.department_id) params.append("department_id", managersFilter.department_id);
      if (managersFilter.gender) params.append("gender", managersFilter.gender);
      params.append("role", "manager");
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) setManagers(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateManager = async () => {
    if (!editingManager) return;
    setError("");
    const validation = validateUserUpdate({ ...editingManager, role: "manager" });
    if (!validation.valid) { setError(validation.message || "Invalid input"); return; }
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingManager, role: "manager" }),
      });
      if (res.ok) { setEditingManager(null); fetchManagers(); }
      else { const data = await res.json(); setError(data.error || "Update failed"); }
    } catch (err) { setError("An error occurred during update"); }
  };

  const confirmedDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch("/api/users/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: deleteConfirm }) });
      if (res.ok) { setManagers(managers.filter((m) => m.id !== deleteConfirm)); setDeleteConfirm(null); }
      else { const data = await res.json(); setError(data.error || "Delete failed"); setDeleteConfirm(null); }
    } catch (err) { setError("An error occurred during deletion"); setDeleteConfirm(null); }
  };

  if (status === "loading" || !session) return null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Managers</h1>
          <p className="page-subtitle">{managers.length} manager{managers.length !== 1 ? "s" : ""} across all departments</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative group col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={managersFilter.search}
              onChange={(e) => dispatch(setManagersSearch(e.target.value))}
              className="input-base input-with-icon block w-full"
            />
          </div>
          <select value={managersFilter.department_id} onChange={(e) => dispatch(setManagersDepartment(e.target.value))} className="input-base bg-white">
            <option value="">All Departments</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={managersFilter.gender} onChange={(e) => dispatch(setManagersGender(e.target.value))} className="input-base bg-white">
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Department</th>
                <th className="pr-6" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400">Loading…</td></tr>
              ) : managers.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400">No managers found</td></tr>
              ) : (
                managers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{m.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="capitalize badge badge-slate">{m.gender || "—"}</span></td>
                    <td className="text-slate-600">{m.contact_number || "—"}</td>
                    <td><span className="badge badge-indigo">{departments.find((d: any) => d.id === m.department_id)?.name || "—"}</span></td>
                    <td className="pr-6" style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setError(""); setEditingManager(m); }} className="btn btn-ghost text-xs px-2.5 py-1.5 text-slate-600 hover:text-indigo-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => { setError(""); setDeleteConfirm(m.id); }} className="btn btn-danger text-xs px-2.5 py-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingManager && (
        <div className="modal-overlay" onClick={() => setEditingManager(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100"><h2 className="text-base font-semibold text-slate-900">Edit Manager</h2></div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
              <input type="text" placeholder="Name" value={editingManager.name} onChange={(e) => setEditingManager({ ...editingManager, name: e.target.value })} className="input-base" />
              <input type="email" placeholder="Email" value={editingManager.email} onChange={(e) => setEditingManager({ ...editingManager, email: e.target.value })} className="input-base" />
              <input type="tel" placeholder="Contact Number" value={editingManager.contact_number || ""} onChange={(e) => setEditingManager({ ...editingManager, contact_number: e.target.value })} className="input-base" />
              <select value={editingManager.department_id} onChange={(e) => setEditingManager({ ...editingManager, department_id: Number(e.target.value) })} className="input-base bg-white">
                {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={editingManager.gender || ""} onChange={(e) => setEditingManager({ ...editingManager, gender: e.target.value })} className="input-base bg-white">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingManager(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={updateManager} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Manager?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary flex-1">Keep</button>
                <button onClick={confirmedDelete} className="btn btn-danger flex-1">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}