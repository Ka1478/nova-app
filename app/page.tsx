'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  CheckSquare,
  Activity,
  Plus,
  ChevronRight
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import { Task } from '@/components/KanbanBoard';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchAnalytics = () => {
    fetch('/api/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading NOVA Dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const projects = analytics?.projectsWithProgress || [];
  const activity = analytics?.recentActivity || [];
  const statusCounts = analytics?.statusCounts || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-brand-900/60 via-slate-900 to-indigo-950/60 border border-brand-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-semibold border border-brand-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Platform Overview
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome back to NOVA Platform
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Plan projects, track team velocity, manage tasks in Kanban swimlanes, and deliver on time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/projects"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-500/20 flex items-center gap-1.5 transition"
            >
              <span>Explore Projects</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Projects */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Projects</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{summary.activeProjects || 0}</h3>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {summary.totalProjects || 0} total registered
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <FolderKanban className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Completion Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Completion Rate</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{summary.completionRate || 0}%</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {summary.completedTasks || 0} of {summary.totalTasks || 0} tasks done
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Active Tasks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Active Tasks</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{summary.activeTasks || 0}</h3>
            <p className="text-[11px] text-amber-400 mt-1">In progress & review</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Team Members */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Team Size</p>
            <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{summary.totalMembers || 0}</h3>
            <p className="text-[11px] text-purple-400 mt-1">Active collaborators</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Grid: Projects Progress & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Active Projects Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-brand-400" />
              Active Projects & Progress
            </h2>
            <Link href="/projects" className="text-xs font-semibold text-brand-400 hover:underline flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj: any) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="bg-slate-900/90 border border-slate-800 hover:border-brand-500/40 rounded-2xl p-4 flex flex-col justify-between transition group shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {proj.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      proj.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-brand-300 transition mb-1">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-brand-400 font-bold">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-brand-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{proj.completed_tasks || 0} / {proj.total_tasks || 0} Tasks Completed</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column (1 col): Audit Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Recent Activity
            </h2>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 max-h-[460px] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">No recent activity logged.</p>
            ) : (
              activity.map((act: any) => (
                <div key={act.id} className="flex gap-3 text-xs border-b border-slate-800/60 pb-3 last:border-0 last:pb-0">
                  <img
                    src={act.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user_name}`}
                    alt={act.user_name}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-brand-500/30"
                  />
                  <div className="flex-1">
                    <p className="text-slate-200 leading-snug">
                      <span className="font-semibold text-white">{act.user_name}</span> {act.details}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {new Date(act.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
