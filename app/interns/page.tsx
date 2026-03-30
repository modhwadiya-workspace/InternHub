"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateUserUpdate } from "@/lib/validation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setInternsSearch, setInternsDepartment, setInternsGender } from "@/lib/redux/slices/internsFilterSlice";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "inactive" ? "badge-danger" : "badge-success"}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${status === "inactive" ? "bg-red-500" : "bg-emerald-500"}`} />
      {status === "inactive" ? "Inactive" : "Active"}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = ["from-indigo-400 to-indigo-600", "from-violet-400 to-violet-600", "from-sky-400 to-sky-600", "from-emerald-400 to-emerald-600", "from-pink-400 to-pink-600"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const internsFilter = useAppSelector((state) => state.internsFilter);

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role === "intern") {
      router.push("/profile");
    } else if (status === "authenticated") {
      fetchDepartments();
      fetchUsers();
    }
  }, [status, session, internsFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) setDepartments(data.departments);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (!session?.user) return;
      const isAdmin = session.user.role === "admin";
      const params = new URLSearchParams();
      if (internsFilter.search) params.append("search", internsFilter.search);
      if (internsFilter.department_id && isAdmin) params.append("department_id", internsFilter.department_id);
      if (internsFilter.gender) params.append("gender", internsFilter.gender);
      params.append("role", "intern");
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleEditClick = (user: any) => {
    setError("");
    const internData = user.interns?.[0] || {};
    setEditingUser({
      ...user,
      college: internData.college || "",
      joining_date: internData.joining_date || "",
      status: internData.status || "active",
      contact_number: user.contact_number || "",
    });
  };

  const confirmedDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirm }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter((u) => u.id !== deleteConfirm));
        setDeleteConfirm(null);
      } else { 
        setError(data.error || "Failed to delete user"); 
      }
    } catch (err) { console.error(err); }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    setError("");
    const validation = validateUserUpdate({ ...editingUser, role: "intern" });
    if (!validation.valid) { setError(validation.message || "Invalid input"); return; }
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          name: editingUser.name,
          email: editingUser.email,
          contact_number: editingUser.contact_number,
          department_id: editingUser.department_id,
          college: editingUser.college,
          gender: editingUser.gender,
          joining_date: editingUser.joining_date,
          status: editingUser.status,
          role: "intern",
        }),
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update user");
      }
    } catch (err) { setError("An error occurred during update"); }
  };

  const handleStatusChange = async (user: any, newStatus: string) => {
    const originalUsers = [...users];
    setUsers(users.map((u) =>
      u.id === user.id ? { ...u, interns: [{ ...(u.interns?.[0] || {}), status: newStatus }] } : u
    ));
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id, name: user.name, email: user.email,
          contact_number: user.contact_number, department_id: user.department_id,
          college: user.interns?.[0]?.college, gender: user.gender,
          joining_date: user.interns?.[0]?.joining_date, status: newStatus, role: "intern",
        }),
      });
      if (!res.ok) { setUsers(originalUsers); }
    } catch (err) { console.error(err); setUsers(originalUsers); }
  };

  if (status === "loading" || !session?.user) return null;
  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? "User Directory" : "My Interns"}</h1>
          <p className="page-subtitle">
            {users.length} intern{users.length !== 1 ? "s" : ""} {isAdmin ? "total" : "under your supervision"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative group col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or college…"
              value={internsFilter.search}
              onChange={(e) => dispatch(setInternsSearch(e.target.value))}
              className="input-base input-with-icon block w-full"
            />
          </div>
          {isAdmin && (
            <select
              value={internsFilter.department_id}
              onChange={(e) => dispatch(setInternsDepartment(e.target.value))}
              className="input-base bg-white"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select
            value={internsFilter.gender}
            onChange={(e) => dispatch(setInternsGender(e.target.value))}
            className="input-base bg-white"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Intern</th>
                <th>Gender</th>
                <th>Contact</th>
                <th>College</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th className="pr-6" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="text-slate-400 text-sm">Loading interns…</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <p className="text-slate-500 font-medium">No interns found</p>
                      <p className="text-slate-400 text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} />
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize badge badge-slate">{user.gender || "—"}</span>
                    </td>
                    <td className="text-slate-600">{user.contact_number || "—"}</td>
                    <td className="text-slate-600 max-w-[160px] truncate">{user.interns?.[0]?.college || "—"}</td>
                    <td className="text-slate-600">
                      {user.interns?.[0]?.joining_date
                        ? new Date(user.interns[0].joining_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td>
                      <select
                        value={user.interns?.[0]?.status || "active"}
                        onChange={(e) => handleStatusChange(user, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer appearance-none ${
                          user.interns?.[0]?.status === "inactive"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <option value="active" className="text-slate-800 bg-white">Active</option>
                        <option value="inactive" className="text-slate-800 bg-white">Inactive</option>
                      </select>
                    </td>
                    <td className="pr-6" style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="btn btn-ghost text-xs px-2.5 py-1.5 text-slate-600 hover:text-indigo-600"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="btn btn-danger text-xs px-2.5 py-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={editingUser.name} />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Edit Intern</h2>
                  <p className="text-xs text-slate-400">{editingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}
              <div className="space-y-4">
                {[
                  { label: "Full Name", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Contact Number", key: "contact_number", type: "tel" },
                  { label: "College", key: "college", type: "text" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      value={editingUser[f.key] || ""}
                      onChange={(e) => setEditingUser({ ...editingUser, [f.key]: e.target.value })}
                      className="input-base"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                  <select
                    value={editingUser.department_id}
                    onChange={(e) => setEditingUser({ ...editingUser, department_id: Number(e.target.value) })}
                    className="input-base bg-white"
                  >
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                  <select
                    value={editingUser.gender || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="input-base bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    value={editingUser.joining_date || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, joining_date: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select
                    value={editingUser.status || "active"}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="input-base bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={updateUser} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-card max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Intern?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone. All data related to this intern will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="btn btn-secondary flex-1">Keep</button>
                <button onClick={confirmedDelete} className="btn btn-danger flex-1 bg-red-600 text-white border-0 hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}