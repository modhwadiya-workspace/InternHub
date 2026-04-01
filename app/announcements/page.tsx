"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import CreateAnnouncementForm from "@/components/CreateAnnouncementForm";
import AnnouncementList from "@/components/AnnouncementList";

interface EditData {
  id: string;
  title: string;
  message: string;
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | null>(null);

  const handleSuccess = () => setRefreshTrigger((prev) => prev + 1);
  const canCreate = session?.user?.role === "admin" || session?.user?.role === "manager";

  const handleEdit = (announcement: any) => {
    setEditData({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) handleSuccess();
    } catch (err) {
      console.error("Failed to delete announcement", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Stay up to date with the latest news and updates</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditData(null); setIsModalOpen(true); }} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Announcement
          </button>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <CreateAnnouncementForm
            onSuccess={handleSuccess}
            onClose={handleCloseModal}
            editData={editData}
          />
        </div>
      )}

      <AnnouncementList refreshTrigger={refreshTrigger} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
