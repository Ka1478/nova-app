'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Grid,
  List as ListIcon
} from 'lucide-react';
import ProjectModal from '@/components/ProjectModal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryFilter !== 'All') params.append('category', categoryFilter);
    if (statusFilter !== 'All') params.append('status', statusFilter);
    if (search) params.append('search', search);

    fetch(`/api/projects?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setProjects(data.projects || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProjects();
  }, [categoryFilter, statusFilter, search]);

  const categories = ['All', 'Engineering', 'Design', 'Marketing', 'Product', 'Operations'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-brand-400" />
            Projects Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage projects, monitor completion milestones, and view assigned team members.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-brand-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & View Switcher Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right Controls: Search, Status Filter, Grid/List Switch */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter projects..."
              className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-lg ${viewMode === 'grid' ? 'bg-slate-700 text-brand-400' : 'text-slate-400'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded-lg ${viewMode === 'list' ? 'bg-slate-700 text-brand-400' : 'text-slate-400'}`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid / List View */}
      {loading ? (
        <div className="py-12 flex justify-center text-xs text-slate-400">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or create a new project.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/projects/${proj.id}`}
              className="bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 flex flex-col justify-between transition group shadow-lg"
            >
              <div>
                {/* Category & Status Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {proj.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border ${
                      proj.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : proj.status === 'Planning'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-100 group-hover:text-brand-300 transition mb-2">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 mb-5 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              {/* Progress & Team Footer */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Completion</span>
                  <span className="text-brand-400 font-bold">{proj.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-brand-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Member Avatars Stack */}
                  <div className="flex -space-x-2 overflow-hidden">
                    {proj.members && proj.members.slice(0, 4).map((m: any) => (
                      <img
                        key={m.id}
                        src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                        alt={m.name}
                        title={m.name}
                        className="w-6 h-6 rounded-full border-2 border-slate-900 object-cover"
                      />
                    ))}
                    {proj.members && proj.members.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 text-[10px] font-bold text-slate-400 flex items-center justify-center">
                        +{proj.members.length - 4}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    {proj.completed_tasks || 0}/{proj.total_tasks || 0} Tasks
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Project Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Progress</th>
                <th className="p-4">Tasks</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {projects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-800/50 transition">
                  <td className="p-4 font-semibold text-slate-200">
                    <Link href={`/projects/${proj.id}`} className="hover:text-brand-400">
                      {proj.name}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-400">{proj.category}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${proj.progress}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-brand-400">{proj.progress}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400">
                    {proj.completed_tasks || 0}/{proj.total_tasks || 0}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/projects/${proj.id}`}
                      className="px-3 py-1 bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition"
                    >
                      Open Workspace
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onProjectCreated={fetchProjects}
      />
    </div>
  );
}
