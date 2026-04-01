"use client";

import { useEffect, useState } from "react";
import TaskList, { Task } from "@/components/tasks/TaskList";
import AddTaskModal from "@/components/tasks/AddTaskModal";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import EditTaskModal from "@/components/tasks/EditTaskModal";
import { useSession } from "next-auth/react";

export default function TasksPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroupTasks, setSelectedGroupTasks] = useState<Task[]>([]);
  const [taskToEdit, setTaskToEdit] = useState<{task: Task, group?: Task[]} | null>(null);
  const [activeTab, setActiveTab ] = useState<"all" | "todo" | "in_progress" | "completed">("all");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const filteredTasks = tasks.filter((task: any) => 
    activeTab === "all" ? true : task.status === activeTab
  );

  const tabs = [
    { id: "all", label: "All Tasks" },
    { id: "todo", label: "To Do" },
    { id: "in_progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Task Board</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Streamline your workflow and track progress.</p>
        </div>
        {(session?.user.role === "admin" || session?.user.role === "manager") && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="button-primary flex items-center gap-2 px-5 py-2.5 shadow-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        )}
      </header>

      <div className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-slate-100 inline-flex items-center">
          {tabs.map((tab) => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      activeTab === tab.id 
                      ? "bg-white text-indigo-600 shadow-sm border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="relative min-h-[400px]">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 w-full bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <TaskList 
            tasks={filteredTasks} 
            onUpdate={fetchTasks} 
            onViewDetails={(tasks) => {
              setSelectedGroupTasks(tasks);
              setIsDetailModalOpen(true);
            }}
            onEdit={(task, group) => {
              setTaskToEdit({ task, group });
              setIsEditModalOpen(true);
            }}
          />
        )}
      </div>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchTasks} 
      />

      <TaskDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        tasks={selectedGroupTasks}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchTasks}
        task={taskToEdit?.task || null}
        allInternsForGroup={taskToEdit?.group}
      />
    </div>
  );
}
