'use client';

import React, { useEffect, useState } from 'react';
import { Users, Mail, Shield, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export default function TeamPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-brand-400" />
          Team Roster & Workload
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor team allocation, active tasks per member, and productivity metrics.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-xs text-slate-400">Loading team members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((member) => (
            <div
              key={member.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-start gap-3.5 mb-4">
                  <img
                    src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2 border-brand-500/40 object-cover shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{member.name}</h3>
                    <p className="text-xs text-brand-400 font-semibold">{member.role}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-500" /> {member.email}
                    </p>
                  </div>
                </div>

                <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium mb-4">
                  Dept: {member.department || 'Engineering'}
                </div>
              </div>

              {/* Member Workload Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
                <div className="bg-slate-850 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total</span>
                  <span className="text-sm font-bold text-slate-100">{member.assigned_tasks || 0}</span>
                </div>
                <div className="bg-slate-850 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-amber-400 block">Active</span>
                  <span className="text-sm font-bold text-amber-300">{member.active_tasks || 0}</span>
                </div>
                <div className="bg-slate-850 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block">Done</span>
                  <span className="text-sm font-bold text-emerald-300">{member.completed_tasks || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
