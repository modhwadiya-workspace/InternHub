"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { validateUserRegistration, validateUserUpdate } from "@/lib/validation";

export default function ManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [managers, setManagers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ NEW STATES
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department_id: "",
  });

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    email: "",
    department_id: "",
  });

  const openEditModal = (manager: any) => {
    setEditData({
      id: manager.id,
      name: manager.name,
      email: manager.email,
      department_id: manager.department_id.toString(),
    });
    setEditModal(true);
  };

  const updateManager = async (e: any) => {
    e.preventDefault();

    const validation = validateUserUpdate({ ...editData, role: "manager" });
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      const res = await fetch("/api/users/update", {
        method: "POST", // or PUT if your backend supports
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editData.id,
          name: editData.name,
          email: editData.email,
          department_id: parseInt(editData.department_id),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setEditModal(false);
        fetchManagers(); // refresh list
      } else {
        alert(data.error || "Update failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchDepartments();
      fetchManagers();
    }
  }, [status, session]);

  const fetchDepartments = async () => {
    const res = await fetch("/api/departments");
    const data = await res.json();
    setDepartments(data.departments || []);
  };

  const fetchManagers = async () => {
    setLoading(true);
    const res = await fetch("/api/users?role=manager");
    const data = await res.json();
    setManagers(data.users || []);
    setLoading(false);
  };

  const deleteManager = async (id: number) => {
    if (!confirm("Delete this manager?")) return;

    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setManagers(managers.filter((m) => m.id !== id));
      } else {
        alert(data.error || "Failed to delete manager");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting manager");
    }
  };

  // ✅ HANDLE FORM CHANGE
  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ CREATE MANAGER
  const createManager = async (e: any) => {
    e.preventDefault();

    const validation = validateUserRegistration({ ...formData, role: "manager" });
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...formData,
        role: "manager",
        department_id: parseInt(formData.department_id),
      }),
    });

    const data = await res.json();

    if (res.ok) {
      setShowModal(false);
      setFormData({ name: "", email: "", password: "", department_id: "" });
      fetchManagers(); // refresh list
    } else {
      alert(data.error || "Error creating manager");
    }
  };

  if (status === "loading") return null;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-slate-900">Managers</h3>

        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Manager
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow border rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs">Name</th>
              <th className="px-6 py-3 text-left text-xs">Email</th>
              <th className="px-6 py-3 text-left text-xs">Department</th>
              <th className="px-6 py-3 text-right text-xs">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
            ) : managers.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-6">No managers found</td></tr>
            ) : (
              managers.map((m) => (
                <tr key={m.id}>
                  <td className="px-6 py-4">{m.name}</td>
                  <td className="px-6 py-4">{m.email}</td>
                  <td className="px-6 py-4">
                    {departments.find(d => d.id === m.department_id)?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => openEditModal(m)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteManager(m.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">Add Manager</h2>

            <form onSubmit={createManager} className="space-y-3">

              <input
                
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <input
                
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />

              <select
                
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">

            <h2 className="text-xl font-bold mb-4">Edit Manager</h2>

            <form onSubmit={updateManager} className="space-y-3">

              <input
                required
                name="name"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <input
                required
                type="email"
                name="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <select
                required
                value={editData.department_id}
                onChange={(e) => setEditData({ ...editData, department_id: e.target.value })}
                className="w-full border p-2 rounded"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}