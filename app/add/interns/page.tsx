"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormik } from "formik";
import { internSchema } from "@/validations/internSchema";
import { managerSchema } from "@/validations/managerSchema";
import FormField from "@/components/ui/FormField";

function getInputCls(touched: boolean | undefined, error: string | undefined) {
  return `input-base${touched && error ? " error" : ""}`;
}
const disabledCls = "input-base !bg-slate-50 !text-slate-500 cursor-not-allowed";

function page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [roleTab, setRoleTab] = useState<"manager" | "intern">("intern");
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [submitError, setSubmitError] = useState("");

  const isManager = session?.user?.role === "manager";
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "loading") return;
    const fetchDepts = async () => {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();
        if (data.departments) setDepartments(data.departments);
      } catch (err) { console.error(err); }
    };
    fetchDepts();
  }, [status]);

  const initialDeptId = isManager && session?.user?.department_id ? String(session.user.department_id) : "";

  const internFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: "", email: "", password: "", contact_number: "", gender: "male",
      college: "", joining_date: new Date().toISOString().split("T")[0],
      date_of_birth: "", degree: "",
      department_id: initialDeptId || (departments[0]?.id?.toString() ?? ""),
    },
    validationSchema: internSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitError("");
      try {
        const res = await fetch("/api/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, role: "intern", department_id: isManager ? session?.user?.department_id : parseInt(values.department_id), gender: values.gender, college: values.college, date_of_birth: values.date_of_birth || null, degree: values.degree || null }),
        });
        const data = await res.json();
        if (!res.ok || data.error) setSubmitError(data.error || "An error occurred");
        else { resetForm(); router.push("/interns?added=true"); }
      } catch { setSubmitError("An unexpected error occurred."); }
      finally { setSubmitting(false); }
    },
  });

  const managerFormik = useFormik({
    enableReinitialize: true,
    initialValues: { name: "", email: "", password: "", contact_number: "", gender: "male" as "male" | "female", department_id: departments[0]?.id?.toString() ?? "" },
    validationSchema: managerSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setSubmitError("");
      try {
        const res = await fetch("/api/signup", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, role: "manager", department_id: parseInt(values.department_id), gender: values.gender }),
        });
        const data = await res.json();
        if (!res.ok || data.error) setSubmitError(data.error || "An error occurred");
        else { resetForm(); router.push("/managers?added=true"); }
      } catch { setSubmitError("An unexpected error occurred."); }
      finally { setSubmitting(false); }
    },
  });

  const role = isManager ? "intern" : roleTab;
  const formik = role === "intern" ? internFormik : managerFormik;
  const f = formik as any;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Add {isAdmin ? "New Member" : "Intern"}</h1>
        <p className="page-subtitle">Fill in the details below to create a new account</p>
      </div>

      {/* Tab switcher (admin only) */}
      {isAdmin && (
        <div className="card p-1 flex gap-1 w-fit">
          {(["intern", "manager"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { setRoleTab(r); setSubmitError(""); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
                roleTab === r
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              Add {r}
            </button>
          ))}
        </div>
      )}

      {/* Form card */}
      <div className="card p-6 max-w-2xl">
        {submitError && (
          <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            {submitError}
          </div>
        )}

        <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Basic Information</h3>
            <div className="space-y-4">
              <FormField label="Full Name" id="name" error={f.errors.name} touched={f.touched.name} required>
                <input type="text" name="name" value={f.values.name} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="John Doe" className={getInputCls(f.touched.name, f.errors.name)} />
              </FormField>

              <FormField label="Department" id="department_id" error={f.errors.department_id} touched={f.touched.department_id} required>
                {isManager ? (
                  <div className={disabledCls}>{departments.find((d) => d.id === session?.user?.department_id)?.name || "Your Department"}</div>
                ) : (
                  <select name="department_id" value={f.values.department_id} onChange={f.handleChange} onBlur={f.handleBlur} className={`${getInputCls(f.touched.department_id, f.errors.department_id)} bg-white`}>
                    {departments.length === 0 && <option value="">Loading departments…</option>}
                    {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                  </select>
                )}
              </FormField>
            </div>
          </div>

          {/* Section: Intern-specific fields */}
          {role === "intern" && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Intern Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Gender" id="gender" error={f.errors.gender} touched={f.touched.gender} required>
                  <select name="gender" value={f.values.gender} onChange={f.handleChange} onBlur={f.handleBlur} className={`${getInputCls(f.touched.gender, f.errors.gender)} bg-white`}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </FormField>
                <FormField label="Contact Number" id="contact_number" error={f.errors.contact_number} touched={f.touched.contact_number} required>
                  <input type="tel" name="contact_number" value={f.values.contact_number} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="1234567890" className={getInputCls(f.touched.contact_number, f.errors.contact_number)} />
                </FormField>
                <FormField label="College / University" id="college" error={f.errors.college} touched={f.touched.college} required>
                  <input type="text" name="college" value={f.values.college} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="State University" className={getInputCls(f.touched.college, f.errors.college)} />
                </FormField>
                <FormField label="Joining Date" id="joining_date" error={f.errors.joining_date} touched={f.touched.joining_date} required>
                  <input type="date" name="joining_date" value={f.values.joining_date} onChange={f.handleChange} onBlur={f.handleBlur} className={getInputCls(f.touched.joining_date, f.errors.joining_date)} />
                </FormField>
                <FormField label="Date of Birth" id="date_of_birth" error={f.errors.date_of_birth} touched={f.touched.date_of_birth}>
                  <input type="date" name="date_of_birth" value={f.values.date_of_birth} onChange={f.handleChange} onBlur={f.handleBlur} className={getInputCls(f.touched.date_of_birth, f.errors.date_of_birth)} />
                </FormField>
                <FormField label="Degree / Program" id="degree" error={f.errors.degree} touched={f.touched.degree} className="col-span-2">
                  <input type="text" name="degree" value={f.values.degree} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="e.g. B.Tech Computer Science" className={getInputCls(f.touched.degree, f.errors.degree)} />
                </FormField>
              </div>
            </div>
          )}

          {/* Contact for manager */}
          {role === "manager" && (
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Manager Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Gender" id="gender" error={f.errors.gender} touched={f.touched.gender} required>
                  <select name="gender" value={f.values.gender} onChange={f.handleChange} onBlur={f.handleBlur} className={`${getInputCls(f.touched.gender, f.errors.gender)} bg-white`}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </FormField>
                <FormField label="Contact Number" id="contact_number" error={f.errors.contact_number} touched={f.touched.contact_number} required>
                  <input type="tel" name="contact_number" value={f.values.contact_number} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="1234567890" className={getInputCls(f.touched.contact_number, f.errors.contact_number)} />
                </FormField>
              </div>
            </div>
          )}

          {/* Section: Account credentials */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Account Credentials</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email Address" id="email" error={f.errors.email} touched={f.touched.email} required>
                <input type="email" name="email" value={f.values.email} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="john@example.com" className={getInputCls(f.touched.email, f.errors.email)} />
              </FormField>
              <FormField label="Password" id="password" error={f.errors.password} touched={f.touched.password} required>
                <input type="password" name="password" value={f.values.password} onChange={f.handleChange} onBlur={f.handleBlur} placeholder="••••••••" className={getInputCls(f.touched.password, f.errors.password)} />
              </FormField>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={formik.isSubmitting || !formik.isValid || departments.length === 0}
              className="btn btn-primary w-full py-2.5 text-sm font-semibold rounded-xl"
            >
              {formik.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account…
                </span>
              ) : `Add ${role === "intern" ? "Intern" : "Manager"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default page;