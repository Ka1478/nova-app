'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  Plus, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Flame,
  CheckCircle2
} from 'lucide-react';

export interface Task {
  id: number | string;
  project_id: number | string;
  project_name?: string;
  title: string;
  description?: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignee_id?: number | string;
  assignee_name?: string;
  assignee_avatar?: string;
  due_date?: string;
  estimated_hours?: number;
  logged_hours?: number;
  tags?: string[];
  comments_count?: number;
  checklists_total?: number;
  checklists_completed?: number;
}

const COLUMNS: { key: Task['status']; title: string; color: string; bgBadge: string }[] = [
  { key: 'Backlog', title: 'Backlog', color: 'border-slate-600 text-slate-400', bgBadge: 'bg-slate-800 text-slate-300' },
  { key: 'To Do', title: 'To Do', color: 'border-blue-500 text-blue-400', bgBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'In Progress', title: 'In Progress', color: 'border-amber-500 text-amber-400', bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'In Review', title: 'In Review', color: 'border-purple-500 text-purple-400', bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { key: 'Done', title: 'Done', color: 'border-emerald-500 text-emerald-400', bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

export default function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  onAddTask,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskStatusChange: (taskId: number | string, newStatus: Task['status']) => void;
  onAddTask: (status: Task['status']) => void;
}) {
  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'Urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><Flame className="w-2.5 h-2.5" /> Urgent</span>;
      case 'High':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-normal bg-slate-800 text-slate-400 border border-slate-700">Low</span>;
    }
  };

  const statusOrder: Task['status'][] = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  const handleMove = (e: React.MouseEvent, taskId: number | string, currentStatus: Task['status'], direction: 'left' | 'right') => {
    e.stopPropagation();
    const currentIndex = statusOrder.indexOf(currentStatus);
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < statusOrder.length) {
      onTaskStatusChange(taskId, statusOrder[newIndex]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 h-full min-h-[500px]">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);

        return (
          <div
            key={col.key}
            className="flex flex-col bg-slate-900/50 rounded-2xl border border-slate-800/80 p-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full border ${col.color.split(' ')[0]} bg-current`} />
                <h3 className="font-semibold text-xs text-slate-200 tracking-wide">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${col.bgBadge}`}>
                  {colTasks.length}
                </span>
              </div>
              <button
                onClick={() => onAddTask(col.key)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Add task to column"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Task Cards Column Body */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {colTasks.length === 0 ? (
                <div className="py-8 border-2 border-dashed border-slate-800/60 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>No tasks</p>
                  <button
                    onClick={() => onAddTask(col.key)}
                    className="mt-2 text-brand-400 hover:underline text-[11px]"
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                colTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick(task)}
                    className="bg-slate-850 hover:bg-slate-800/90 border border-slate-700/60 hover:border-brand-500/40 rounded-xl p-3.5 shadow-md cursor-pointer transition group relative"
                  >
                    {/* Top Row: Tags & Priority */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap gap-1">
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        {col.key !== 'Backlog' && (
                          <button
                            onClick={(e) => handleMove(e, task.id, task.status, 'left')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            title="Move Left"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                        )}
                        {col.key !== 'Done' && (
                          <button
                            onClick={(e) => handleMove(e, task.id, task.status, 'right')}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                            title="Move Right"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="font-medium text-sm text-slate-100 mb-1.5 leading-snug line-clamp-2">
                      {task.title}
                    </h4>

                    {/* Description preview */}
                    {task.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}

                    {/* Tags List */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Meta Row */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-700/40 text-[11px] text-slate-400">
                      <div className="flex items-center gap-3">
                        {task.due_date && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.due_date}</span>
                          </div>
                        )}
                      </div>

                      {/* Assignee Avatar */}
                      {task.assignee_name ? (
                        <div className="flex items-center gap-1.5" title={`Assigned to ${task.assignee_name}`}>
                          <img
                            src={task.assignee_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee_name}`}
                            alt={task.assignee_name}
                            className="w-5 h-5 rounded-full border border-brand-500/40 object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
