'use client';

import React, { useState } from 'react';
import './globals.css';
import { AuthProvider } from '@/components/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProjectModal from '@/components/ProjectModal';
import TaskCreateModal from '@/components/TaskCreateModal';
import ProfileModal from '@/components/ProfileModal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <head>
        <title>NOVA — Team Productivity Platform</title>
        <meta name="description" content="Plan. Collaborate. Deliver. Full-stack Project Management Application." />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar
              onOpenNewProject={() => setIsProjectModalOpen(true)}
              onOpenProfile={() => setIsProfileModalOpen(true)}
            />
            <div className="flex-1 flex flex-col min-w-0">
              <Header
                onOpenNewTask={() => setIsTaskModalOpen(true)}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
              <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
          </div>

          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
            onProjectCreated={() => {
              window.location.reload();
            }}
          />

          <TaskCreateModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            onTaskCreated={() => {
              window.location.reload();
            }}
          />

          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
