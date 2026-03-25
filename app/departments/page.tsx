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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && session.user.role !== "admin") {
      router.push("/dashboard");
    } else if (status === "authenticated") {
      fetchDepartments();
    }
  }, [status, session]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments) {
        setDepartments(data.departments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDept.trim()) return;

    if (!isValidDepartmentName(newDept)) {
        alert("Department name must be at least 2 characters long.");
        return;
    }

    try {
      const res = await fetch("/api/departments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDept }),
      });
      const data = await res.json();
      if (data.department) {
        setDepartments([...departments, data.department]);
        setNewDept("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteDepartment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    try {
      await fetch("/api/departments/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDepartments(departments.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || (status === "authenticated" && session.user.role !== "admin")) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold leading-6 text-slate-900">Departments Management</h3>
          <p className="mt-2 text-sm text-slate-500">
            Create, view, and manage company departments.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-100 p-6">
        <h4 className="text-base font-medium text-slate-900 mb-4">Add New Department</h4>
        <form onSubmit={addDepartment} className="flex gap-4">
          <input
            type="text"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            placeholder="Department Name"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            Add Department
          </button>
        </form>
      </div>

      <div className="bg-white shadow border border-slate-200 sm:rounded-lg overflow-hidden mt-8">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Department Name
              </th>
              <th scope="col" className="relative px-6 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-500">Loading...</td></tr>
            ) : departments.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-500">No departments found.</td></tr>
            ) : (
              departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{dept.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{dept.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
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
    </div>
  );
}