"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { validateUserRegistration } from "@/lib/validation";

function page() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [role, setRole] = useState<"manager" | "intern">("intern");
    const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        department_id: "",
        gender: "male",
        college: "",
        contact_number: "",
        joining_date: new Date().toISOString().split('T')[0],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (status === "loading") return;

        // Fetch departments for dropdown
        const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/departments");
            const data = await res.json();
            if (data.departments) {
                setDepartments(data.departments);
                if (session?.user?.role === "manager" && session?.user?.department_id) {
                    setFormData(prev => ({ ...prev, department_id: session!.user!.department_id!.toString() }));
                } else if (data.departments.length > 0) {
                    setFormData(prev => ({ ...prev, department_id: data.departments[0].id.toString() }));
                }
            }
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
        };
        fetchDepartments();
    }, [status, session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const bodyData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: role,
                department_id: session?.user?.role === "manager" ? session?.user?.department_id : parseInt(formData.department_id),
                gender: role === "intern" ? formData.gender : null,
                college: role === "intern" ? formData.college : null,
                contact_number: formData.contact_number,
                joining_date: role === "intern" ? formData.joining_date : null,
            };

            const validation = validateUserRegistration(bodyData);
            if (!validation.valid) {
                setError(validation.message || "Invalid input");
                setLoading(false);
                return;
            }

            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error || "An error occurred");
            } else {
                router.push("/interns?added=true");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input  name="name" type="text" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                    {session?.user?.role === "manager" ? (
                        <div className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed">
                            {departments.find(d => d.id === session?.user?.department_id)?.name || "Your Department"}
                        </div>
                    ) : (
                        <select  name="department_id" value={formData.department_id} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                            {departments.length === 0 && <option value="">Loading departments...</option>}
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                        <select  name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                        <input  name="contact_number" type="tel" value={formData.contact_number} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="1234567890" minLength={10} maxLength={10} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">College/University</label>
                        <input  name="college" type="text" value={formData.college} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="State University" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Joining Date</label>
                        <input  name="joining_date" type="date" value={formData.joining_date} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                    </div>
                </div>
                

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input  name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="john@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input  name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" />
                    </div>
                </div>


                <button
                    type="submit"
                    disabled={loading || departments.length === 0}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center mt-6"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : "Add Intern"}
                </button>
            </form>
        </div>
    )
}

export default page