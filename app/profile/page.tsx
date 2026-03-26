"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    college: "",
    contact_number: "",
    joining_date: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (session?.user) {
      if (session.user.role !== "intern") {
        router.push("/dashboard");
      } else {
          setFormData({
            name: session.user.name || "",
            email: session.user.email || "",
            gender: session.user.gender || "",
            college: session.user.college || "",
            contact_number: session.user.contact_number || "",
            joining_date: session.user.joining_date || ""
          });
      }
    }
  }, [session, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.user.id,
          name: formData.name,
          email: formData.email,
          college: formData.college,
          gender: formData.gender,
          contact_number: formData.contact_number,
          role: "intern"
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setMessage({ text: data.error || "Failed to update profile.", type: "error" });
        return;
      }
      if (data.success) {
        await update({
          user: {
            ...session.user,
            name: formData.name,
            college: formData.college,
            gender: formData.gender,
            contact_number: formData.contact_number,
          }
        });
        setMessage({ text: "Profile updated successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to update profile.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An unexpected error occurred.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !session?.user || session.user.role !== "intern") return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="pb-5 border-b border-slate-200">
        <h3 className="text-2xl font-bold leading-6 text-slate-900">My Profile</h3>
        <p className="mt-2 text-sm text-slate-500">
          Update your personal details below. Your role and department are managed by Admin.
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">College / University</label>
                <input
                  type="text"
                  name="college"
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  minLength={10} maxLength={10}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  disabled
                  className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}