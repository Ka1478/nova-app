'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus } from 'lucide-react';
import { Task } from './KanbanBoard';

export default function TaskCreateModal({
  isOpen,
  onClose,
  onTaskCreated,
  defaultProjectId,
  defaultStatus = 'To Do',
}: {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  defaultProjectId?: number | string;
  defaultStatus?: Task['status'];
}) {
  const [projects, setProjects] = useState<Array<{ id: number | string; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number | string; name: string }>>([]);
  const [projectId, setProjectId] = useState<number | string>(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>(defaultStatus);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [assigneeId, setAssigneeId] = useState<number | string>('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Feature']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultStatus) setStatus(defaultStatus);

      fetch('/api/projects')
        .then((res) => res.json())
        .then((data) => {
          setProjects(data.projects || []);
          if (!defaultProjectId && data.projects?.length > 0) {
            setProjectId(data.projects[0].id);
          }
        })
        .catch(console.error);

      fetch('/api/team')
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(console.error);
    }
  }, [isOpen, defaultProjectId, defaultStatus]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      setError('Project and task title are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate,
          estimated_hours: Number(estimatedHours) || 0,
          tags,
        }),
      });

      if (res.ok) {
        onTaskCreated();
        onClose();
        setTitle('');
        setDescription('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create task');
      }
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-brand-400" />
            <h2 className="font-bold text-base text-slate-100">Create New Task</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Target Project *</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
              required
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth2 Login Provider"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria, or design links..."
              rows={3}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Est. Hours</label>
              <input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tag (e.g. Backend, UI)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs rounded-xl transition"
              >
                + Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20 flex items-center gap-1"
                >
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-rose-400">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-brand-600/30"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
