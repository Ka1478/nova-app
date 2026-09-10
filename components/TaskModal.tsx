'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckSquare, 
  MessageSquare, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  Trash2, 
  Send,
  Check,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Task } from './KanbanBoard';

export default function TaskModal({
  task,
  onClose,
  onUpdate,
  onDelete,
  users = [],
}: {
  task: Task | null;
  onClose: () => void;
  onUpdate: (updatedTask: Partial<Task>) => void;
  onDelete: (taskId: any) => void;
  users?: Array<{ id: number | string; name: string; avatar_url?: string; role?: string }>;
}) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!task) return;
    setLoading(true);
    fetch(`/api/tasks/${task.id}`)
      .then((res) => res.json())
      .then((data) => {
        setDetails(data.task);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [task]);

  if (!task) return null;

  const currentStatus = details?.status || task.status;
  const currentPriority = details?.priority || task.priority;
  const currentAssignee = details?.assignee_id || task.assignee_id;

  const handleStatusChange = (status: Task['status']) => {
    setDetails({ ...details, status });
    onUpdate({ id: task.id, status });
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const handlePriorityChange = (priority: Task['priority']) => {
    setDetails({ ...details, priority });
    onUpdate({ id: task.id, priority });
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority }),
    });
  };

  const handleAssigneeChange = (assignee_id: number | string) => {
    const assignedUser = users.find(u => String(u.id) === String(assignee_id));
    setDetails({ ...details, assignee_id, assignee_name: assignedUser?.name });
    onUpdate({ id: task.id, assignee_id, assignee_name: assignedUser?.name });
    fetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee_id }),
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (res.ok) {
        const data = await res.json();
        setDetails({
          ...details,
          comments: [...(details.comments || []), data.comment],
        });
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-400 text-xs font-semibold border border-brand-500/20">
              TASK #{String(task.id).substring(0, 8)}
            </span>
            <span className="text-xs text-slate-400">In {details?.project_name || task.project_name || 'Project'}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Task Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-100 leading-snug">
              {details?.title || task.title}
            </h2>
          </div>

          {/* Status & Priority Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-850/60 p-4 rounded-xl border border-slate-800">
            {/* Status Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Status</label>
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Backlog">Backlog</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Priority</label>
              <select
                value={currentPriority}
                onChange={(e) => handlePriorityChange(e.target.value as Task['priority'])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">Assignee</label>
              <select
                value={currentAssignee || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={String(u.id)} value={String(u.id)}>
                    {u.name} ({u.role || 'Member'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-slate-300 bg-slate-850 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed">
              {details?.description || task.description || 'No description provided.'}
            </p>
          </div>

          {/* Checklist / Subtasks section */}
          {details?.checklists && details.checklists.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-brand-400" />
                Checklist / Subtasks
              </h3>
              <div className="space-y-2 bg-slate-850 p-4 rounded-xl border border-slate-800">
                {details.checklists.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={!!item.is_completed}
                      readOnly
                      className="rounded bg-slate-800 border-slate-700 text-brand-500 focus:ring-0"
                    />
                    <span className={item.is_completed ? 'line-through text-slate-500' : ''}>{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Discussion Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-400" />
              Activity & Comments
            </h3>

            <div className="space-y-3 mb-4">
              {details?.comments && details.comments.length > 0 ? (
                details.comments.map((comment: any, idx: number) => (
                  <div key={idx} className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 flex gap-3">
                    <img
                      src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_name}`}
                      alt={comment.user_name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-brand-500/30"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-200">{comment.user_name}</span>
                        <span className="text-[10px] text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic py-2">No comments yet. Start the conversation!</p>
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Delete this task?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Task</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
