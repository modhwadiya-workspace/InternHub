"use client";

import { useSession } from "next-auth/react";
import { useFormik } from "formik";
import { announcementSchema } from "@/validations/announcementSchema";
import FormField from "@/components/ui/FormField";

interface EditData {
  id: string;
  title: string;
  message: string;
}

interface CreateAnnouncementFormProps {
  onSuccess: () => void;
  onClose: () => void;
  editData?: EditData | null;
}

export default function CreateAnnouncementForm({ onSuccess, onClose, editData }: CreateAnnouncementFormProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isEditMode = !!editData;

  const formik = useFormik({
    initialValues: {
      title: editData?.title || "",
      message: editData?.message || "",
    },
    enableReinitialize: true,
    validationSchema: announcementSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus("");
      try {
        const url = "/api/announcements";
        const method = isEditMode ? "PUT" : "POST";
        const body = isEditMode
          ? { id: editData!.id, ...values }
          : values;

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setStatus(data.error || `Failed to ${isEditMode ? "update" : "create"} announcement`); return; }
        setTimeout(() => { onSuccess(); onClose(); }, 800);
      } catch {
        setStatus("An unexpected error occurred");
      } finally { setSubmitting(false); }
    },
  });

  if (userRole !== "admin" && userRole !== "manager") return null;

  const isGlobal = userRole === "admin";

  return (
    <div className="modal-card mx-4" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditMode ? "bg-amber-100" : isGlobal ? "bg-indigo-100" : "bg-amber-100"}`}>
            <svg className={`w-5 h-5 ${isEditMode ? "text-amber-600" : isGlobal ? "text-indigo-600" : "text-amber-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isEditMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              )}
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{isEditMode ? "Edit Announcement" : "Create Announcement"}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditMode ? "Update the announcement details" : isGlobal ? "Visible to all users" : "Visible to your department"}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scope badge */}
      {!isEditMode && (
        <div className="px-6 pt-4">
          <span className={`badge ${isGlobal ? "badge-indigo" : "badge-amber"}`}>
            {isGlobal ? "🌐 Global announcement" : "🏢 Department announcement"}
          </span>
        </div>
      )}

      {/* Status banners */}
      {formik.status && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          {formik.status}
        </div>
      )}
      {formik.isSubmitting && !formik.status && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          {isEditMode ? "Updated successfully!" : "Posted successfully!"}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} noValidate className="p-6 space-y-4">
        <FormField label="Title" id="title" error={formik.errors.title} touched={formik.touched.title} required>
          <input
            type="text" name="title" id="title"
            value={formik.values.title} onChange={formik.handleChange} onBlur={formik.handleBlur}
            placeholder="e.g. Public Holiday — 15th August"
            className={`input-base ${formik.touched.title && formik.errors.title ? "error" : ""}`}
          />
        </FormField>

        <FormField label="Message" id="message" error={formik.errors.message} touched={formik.touched.message} required>
          <textarea
            id="message" name="message"
            value={formik.values.message} onChange={formik.handleChange} onBlur={formik.handleBlur}
            rows={4} placeholder="Write your announcement here…"
            className={`input-base resize-none ${formik.touched.message && formik.errors.message ? "error" : ""}`}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} disabled={formik.isSubmitting} className="btn btn-secondary">Cancel</button>
          <button
            type="submit"
            disabled={formik.isSubmitting || !formik.isValid || !formik.dirty}
            className="btn btn-primary min-w-[120px]"
          >
            {formik.isSubmitting ? (
              <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> {isEditMode ? "Updating…" : "Posting…"}</>
            ) : isEditMode ? "Save Changes" : "Post Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
}
