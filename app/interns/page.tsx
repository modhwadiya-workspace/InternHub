"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateUserUpdate } from "@/lib/validation";

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role === "intern") {
      router.push("/profile");
    } else if (status === "authenticated") {
      fetchDepartments();
      fetchUsers();
    }
  }, [status, session, nameFilter, deptFilter, genderFilter, collegeFilter]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (!session?.user) return;
      const isAdmin = session.user.role === "admin";
      const managerDeptId = session.user.department_id;

      const params = new URLSearchParams();
      if (nameFilter) params.append("name", nameFilter);
      if (deptFilter && isAdmin) params.append("department_id", deptFilter);
      if (genderFilter) params.append("gender", genderFilter);
      if (collegeFilter) params.append("college", collegeFilter);
      params.append("role", "intern"); // only fetch interns, or backend will handle it based on manager role, but let's be explicit.

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: any) => {
    const internData = user.interns?.[0] || {};
    setEditingUser({
      ...user,
      college: internData.college || "",
      joining_date: internData.joining_date || "",
      status: internData.status || "active",
      contact_number: user.contact_number || "",
    });
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;

    const validation = validateUserUpdate({ ...editingUser, role: "intern" });
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      await fetch("/api/users/update", {
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

      setEditingUser(null);
      fetchUsers(); // refresh
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (user: any, newStatus: string) => {
    const originalUsers = [...users];
    setUsers(users.map(u => u.id === user.id ? {
        ...u, interns: [{ ...(u.interns?.[0] || {}), status: newStatus }]
    } : u));

    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          contact_number: user.contact_number,
          department_id: user.department_id,
          college: user.interns?.[0]?.college,
          gender: user.gender,
          joining_date: user.interns?.[0]?.joining_date,
          status: newStatus,
          role: "intern",
        }),
      });
      if (!res.ok) {
         setUsers(originalUsers);
         alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      setUsers(originalUsers);
      alert("Error updating status");
    }
  };

  if (status === "loading" || !session?.user) return null;

  const isAdmin = session.user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-2xl font-bold leading-6 text-slate-900">
          {isAdmin ? "User Directory" : "My Interns"}
        </h3>
      </div>

      <div className="bg-white p-4 shadow-sm border border-slate-100 rounded-xl space-y-4">
        <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Filters</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by Name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {isAdmin && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <input
            type="text"
            placeholder="Search by College"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white shadow border border-slate-200 sm:rounded-xl overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gender</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">College</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joining Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="font-medium text-slate-500 relative px-6 py-3">
                  <span >Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Fetching users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found matching filters.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{user.gender || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.contact_number || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.interns?.[0]?.college || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.interns?.[0]?.joining_date || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={user.interns?.[0]?.status || 'active'} 
                        onChange={(e) => handleStatusChange(user, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 outline-none cursor-pointer border-none bg-transparent ${user.interns?.[0]?.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                      >
                         <option value="active" className="text-slate-800 bg-white">Active</option>
                         <option value="inactive" className="text-slate-800 bg-white">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors ml-2"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl p-6 space-y-5">

            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">
              Edit Intern Details
            </h2>

            {/* Name */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Full Name</label>
              <input
                value={editingUser.name}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, name: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Email</label>
              <input
                value={editingUser.email}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, email: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Contact Number</label>
              <input
                value={editingUser.contact_number || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, contact_number: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg"
                minLength={10} maxLength={10}
              />
            </div>

            {/* Department */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Department</label>
              <select
                value={editingUser.department_id}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    department_id: Number(e.target.value),
                  })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* College */}
            <div>
              <label className="text-sm text-slate-600 font-medium">College</label>
              <input
                value={editingUser.college || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, college: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Gender</label>
              <select
                value={editingUser.gender || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, gender: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Joining Date */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Joining Date</label>
              <input
                type="date"
                value={editingUser.joining_date || ""}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, joining_date: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg"
              />
            </div>
            
            {/* Status */}
            <div>
              <label className="text-sm text-slate-600 font-medium">Status</label>
              <select
                value={editingUser.status || "active"}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, status: e.target.value })
                }
                className="w-full mt-1 border px-3 py-2 rounded-lg bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg border text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={updateUser}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}