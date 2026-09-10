'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FolderKanban, 
  Plus, 
  CheckSquare, 
  Users, 
  Activity, 
  Layout, 
  List, 
  Calendar, 
  Clock, 
  ChevronLeft,
  Settings,
  Trash2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import KanbanBoard, { Task } from '@/components/KanbanBoard';
import TaskModal from '@/components/TaskModal';
import TaskCreateModal from '@/components/TaskCreateModal';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kanban' | 'overview' | 'tasks' | 'team' | 'activity'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false);
  const [taskCreateStatus, setTaskCreateStatus] = useState<Task['status']>('To Do');

  const fetchProjectDetails = () => {
    if (!projectId) return;
    fetch(`/api/projects/${projectId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Project not found');
        return res.json();
      })
      .then((data) => {
        setProjectData(data);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading Project Workspace...</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="text-center py-16">
        <h2 className="text-lg font-bold text-slate-300">Project Not Found</h2>
        <button
          onClick={() => router.push('/projects')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const { project, members = [], tasks = [], activity = [] } = projectData;

  const handleTaskStatusChange = async (taskId: number, newStatus: Task['status']) => {
    // Optimistic UI update
    setProjectData((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: Task) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    }));

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskDelete = async (taskId: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      fetchProjectDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddTask = (status: Task['status']) => {
    setTaskCreateStatus(status);
    setIsTaskCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Project Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/projects')}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Projects Directory
        </button>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 text-[11px] font-semibold border border-brand-500/20">
                  {project.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                  {project.status}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                  Priority: {project.priority}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
              <p className="text-xs text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
                {project.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenAddTask('To Do')}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Project Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Overall Progress</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="font-bold text-brand-400">{project.progress}%</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block">Tasks Completed</span>
              <span className="font-semibold text-slate-200 mt-1 block">
                {project.completedTasks} / {project.totalTasks}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Target Due Date</span>
              <span className="font-semibold text-slate-200 mt-1 block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {project.due_date || 'Ongoing'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Team Roster</span>
              <div className="flex -space-x-1.5 overflow-hidden mt-1">
                {members.map((m: any) => (
                  <img
                    key={m.id}
                    src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                    alt={m.name}
                    title={`${m.name} (${m.role})`}
                    className="w-5 h-5 rounded-full border border-slate-900 object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('kanban')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'kanban'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Kanban Board</span>
          <span className="px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 text-[10px]">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Task List</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'team'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Roster ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Activity Log</span>
        </button>
      </div>

      {/* Tab View Content */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={(t) => setSelectedTask(t)}
          onTaskStatusChange={handleTaskStatusChange}
          onAddTask={handleOpenAddTask}
        />
      )}

      {activeTab === 'tasks' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Task Title</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Due Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tasks.map((task: Task) => (
                <tr key={task.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-medium text-slate-100">{task.title}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      {task.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{task.priority}</td>
                  <td className="p-4 text-slate-400">{task.assignee_name || 'Unassigned'}</td>
                  <td className="p-4 text-slate-400">{task.due_date || '—'}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="text-xs text-brand-400 hover:underline font-semibold"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: any) => (
            <div key={m.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <img
                src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                alt={m.name}
                className="w-10 h-10 rounded-full border border-brand-500/40 object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm text-slate-100">{m.name}</h4>
                <p className="text-xs text-slate-400">{m.role} ({m.department || 'Team'})</p>
                <span className="text-[10px] text-brand-400 font-medium">{m.project_role || 'Member'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          {activity.map((act: any) => (
            <div key={act.id} className="flex gap-3 text-xs border-b border-slate-800 pb-3 last:border-0">
              <img
                src={act.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user_name}`}
                alt={act.user_name}
                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
              />
              <div>
                <p className="text-slate-200">
                  <span className="font-semibold text-white">{act.user_name}</span> {act.details}
                </p>
                <span className="text-[10px] text-slate-500">{new Date(act.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => fetchProjectDetails()}
          onDelete={handleTaskDelete}
          users={members}
        />
      )}

      {/* Create Task Modal */}
      <TaskCreateModal
        isOpen={isTaskCreateOpen}
        onClose={() => setIsTaskCreateOpen(false)}
        onTaskCreated={fetchProjectDetails}
        defaultProjectId={Number(projectId)}
        defaultStatus={taskCreateStatus}
      />
    </div>
  );
}
