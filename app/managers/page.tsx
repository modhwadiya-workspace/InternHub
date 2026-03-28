"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateUserRegistration, validateUserUpdate } from "@/lib/validation";

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-sky-400 to-sky-600", "from-violet-400 to-violet-600", "from-indigo-400 to-indigo-600", "from-teal-400 to-teal-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

const FIELD_CLS = "input-base";

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", department_id: "", gender: "male", contact_number: "" });
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: "", name: "", email: "", department_id: "", gender: "male", contact_number: "" });

  const openEditModal = (manager: any) => {
    setEditData({ id: manager.id, name: manager.name, email: manager.email, department_id: manager.department_id, gender: manager.gender || "male", contact_number: manager.contact_number || "" });
    setEditModal(true);
  };

  const updateManager = async (e: any) => {
    e.preventDefault();
    const validation = validateUserUpdate({ ...editData, role: "manager" });
    if (!validation.valid) { alert(validation.message); return; }
    try {
      const res = await fetch("/api/users/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editData.id, name: editData.name, email: editData.email, department_id: parseInt(editData.department_id), gender: editData.gender, contact_number: editData.contact_number }) });
      const data = await res.json();
      if (res.ok) { setEditModal(false); fetchManagers(); } else { alert(data.error || "Update failed"); }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    else if (status === "authenticated" && session?.user?.role !== "admin") router.push("/dashboard");
    else if (status === "authenticated") { fetchDepartments(); fetchManagers(); }
  }, [status, session]);

  const fetchDepartments = async () => { const res = await fetch("/api/departments"); const data = await res.json(); setDepartments(data.departments || []); };
  const fetchManagers = async () => { setLoading(true); const res = await fetch("/api/users?role=manager"); const data = await res.json(); setManagers(data.users || []); setLoading(false); };

  const deleteManager = async (id: number) => {
    if (!confirm("Delete this manager?")) return;
    try {
      const res = await fetch("/api/users/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (res.ok && data.success) setManagers(managers.filter((m) => m.id !== id));
      else alert(data.error || "Failed to delete");
    } catch (err) { console.error(err); }
  };

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const createManager = async (e: any) => {
    e.preventDefault();
    const validation = validateUserRegistration({ ...formData, role: "manager" });
    if (!validation.valid) { alert(validation.message); return; }
    const res = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, role: "manager", department_id: parseInt(formData.department_id) }) });
    const data = await res.json();
    if (res.ok) { setShowModal(false); setFormData({ name: "", email: "", password: "", department_id: "", gender: "male", contact_number: "" }); fetchManagers(); }
    else alert(data.error || "Error creating manager");
  };

  if (status === "loading") return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Managers</h1>
          <p className="page-subtitle">{managers.length} manager{managers.length !== 1 ? "s" : ""} across all departments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Manager
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Manager</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>Department</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-slate-400">Loading managers…</td></tr>
              ) : managers.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    </div>
                    <p className="text-slate-500 font-medium">No managers yet</p>
                    <p className="text-slate-400 text-sm">Click "Add Manager" to get started</p>
                  </div>
                </td></tr>
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
                    <td><span className="badge badge-slate capitalize">{m.gender || "—"}</span></td>
                    <td className="text-slate-600">{m.contact_number || "—"}</td>
                    <td>
                      <span className="badge badge-indigo">{departments.find((d) => d.id === m.department_id)?.name || "—"}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(m)} className="btn btn-ghost text-xs px-2.5 py-1.5 text-slate-600 hover:text-indigo-600">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit
                        </button>
                        <button onClick={() => deleteManager(m.id)} className="btn btn-danger text-xs px-2.5 py-1.5">
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

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Add Manager</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={createManager} className="p-6 space-y-4">
              {[{ label: "Full Name", name: "name", type: "text", placeholder: "Jane Smith" }, { label: "Email", name: "email", type: "email", placeholder: "jane@company.com" }, { label: "Password", name: "password", type: "password", placeholder: "••••••••" }, { label: "Contact Number", name: "contact_number", type: "tel", placeholder: "1234567890" }].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                  <input name={f.name} type={f.type} placeholder={f.placeholder} value={(formData as any)[f.name]} onChange={handleChange} className={FIELD_CLS} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={`${FIELD_CLS} bg-white`}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <select name="department_id" value={formData.department_id} onChange={handleChange} className={`${FIELD_CLS} bg-white`}>
                    <option value="">Select…</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Manager</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Edit Manager</h2>
              <button onClick={() => setEditModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={updateManager} className="p-6 space-y-4">
              {[{ label: "Full Name", key: "name", type: "text" }, { label: "Email", key: "email", type: "email" }, { label: "Contact Number", key: "contact_number", type: "tel" }].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                  <input type={f.type} value={(editData as any)[f.key]} onChange={(e) => setEditData({ ...editData, [f.key]: e.target.value })} className={FIELD_CLS} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} className={`${FIELD_CLS} bg-white`}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <select value={editData.department_id} onChange={(e) => setEditData({ ...editData, department_id: e.target.value })} className={`${FIELD_CLS} bg-white`}>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setEditModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Update Manager</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}