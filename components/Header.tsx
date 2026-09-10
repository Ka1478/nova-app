'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Sparkles, 
  ChevronDown, 
  Camera, 
  Check, 
  CheckCircle2, 
  FolderKanban, 
  MessageSquare, 
  Clock, 
  X 
} from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Header({ 
  onOpenNewTask,
  onOpenProfile,
  onSearch 
}: { 
  onOpenNewTask?: () => void;
  onOpenProfile?: () => void;
  onSearch?: (term: string) => void;
}) {
  const { user, demoLogin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = () => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch((err) => console.error(err));
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const handleDemoSwitch = async (role: 'Admin' | 'PM' | 'Developer' | 'Designer') => {
    setShowDemoMenu(false);
    await demoLogin(role);
  };

  const handleMarkAllRead = () => {
    setUnreadCount(0);
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search projects, tasks, or tags..."
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition"
        />
      </div>

      {/* Header Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/70 border border-slate-700 text-xs text-slate-300 font-medium transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch Role ({user?.role || 'Guest'})</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Demo Profiles</p>
              <button
                onClick={() => handleDemoSwitch('Admin')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Alex Morgan</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Admin</span>
              </button>
              <button
                onClick={() => handleDemoSwitch('PM')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Sophia Chen</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300">PM</span>
              </button>
              <button
                onClick={() => handleDemoSwitch('Developer')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Marcus Vance</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Dev</span>
              </button>
              <button
                onClick={() => handleDemoSwitch('Designer')}
                className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Elena Rostova</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Design</span>
              </button>
            </div>
          )}
        </div>

        {/* Create Task Button */}
        <button
          onClick={onOpenNewTask}
          className="py-1.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>

        {/* User Profile Avatar Picture Button */}
        {user && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition group"
            title="Edit Profile Picture"
          >
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-brand-500/40"
            />
            <span className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 pr-1">{user.name}</span>
          </button>
        )}

        {/* Clickable Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              if (!showNotifications) fetchNotifications();
              setShowNotifications(!showNotifications);
            }}
            className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500 animate-ping"></span>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-brand-500 flex items-center justify-center text-[8px] font-bold text-white"></span>
              </>
            )}
          </button>

          {/* Notifications Dropdown Overlay */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-400" />
                  <h3 className="font-bold text-xs text-slate-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-400 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-brand-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-6">No recent notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setShowNotifications(false)}
                      className={`p-3 flex items-start gap-3 hover:bg-slate-800/60 cursor-pointer transition ${
                        n.unread ? 'bg-slate-850/50' : ''
                      }`}
                    >
                      <img
                        src={n.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.user_name || 'User'}`}
                        alt={n.user_name}
                        className="w-7 h-7 rounded-full shrink-0 object-cover border border-slate-700 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-200">{n.title}</h4>
                          <span className="text-[9px] text-slate-500">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-800 bg-slate-850 text-center">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[11px] font-medium text-slate-400 hover:text-slate-200"
                >
                  Close Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
