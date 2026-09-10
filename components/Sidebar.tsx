'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Sparkles, 
  PlusCircle, 
  LogOut,
  RefreshCw,
  Rocket,
  Camera
} from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Sidebar({ 
  onOpenNewProject,
  onOpenProfile
}: { 
  onOpenNewProject?: () => void;
  onOpenProfile?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [reseeding, setReseeding] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'My Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Team', href: '/team', icon: Users },
  ];

  const handleSeed = async () => {
    if (confirm('Reset database with demo data?')) {
      setReseeding(true);
      try {
        await fetch('/api/seed', { method: 'POST' });
        window.location.reload();
      } catch (err) {
        console.error(err);
      } finally {
        setReseeding(false);
      }
    }
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
            <Rocket className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-slate-200 to-brand-400 bg-clip-text text-transparent">
              NOVA
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Plan. Collaborate. Deliver.</p>
          </div>
        </div>

        {/* Create Project Button */}
        <div className="px-4 py-4">
          <button
            onClick={onOpenNewProject}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/25 transition duration-150"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Reset Data */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {user && (
          <div className="flex items-center justify-between bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition group"
              title="Click to edit profile picture"
            >
              <div className="relative">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-brand-500/40 object-cover"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-300 transition">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
              </div>
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={reseeding}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 flex items-center justify-center gap-1.5 transition border border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
          <span>{reseeding ? 'Reseeding...' : 'Reset Demo Data'}</span>
        </button>
      </div>
    </aside>
  );
}
