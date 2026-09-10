import connectMongoDB from './mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import Task from '@/models/Task';
import ActivityLog from '@/models/ActivityLog';
import bcrypt from 'bcryptjs';

export async function autoSeedMongoDB() {
  if (!process.env.MONGODB_URI) return;
  try {
    await connectMongoDB();
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('🌱 Auto-seeding MongoDB Atlas database...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Create Users
    const u1 = await User.create({
      name: 'Alex Morgan',
      email: 'alex@nova.app',
      password_hash: passwordHash,
      role: 'Admin',
      department: 'Executive',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const u2 = await User.create({
      name: 'Sophia Chen',
      email: 'sophia@nova.app',
      password_hash: passwordHash,
      role: 'Product Manager',
      department: 'Product',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    });

    const u3 = await User.create({
      name: 'Marcus Vance',
      email: 'marcus@nova.app',
      password_hash: passwordHash,
      role: 'Lead Engineer',
      department: 'Engineering',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    });

    const u4 = await User.create({
      name: 'Elena Rostova',
      email: 'elena@nova.app',
      password_hash: passwordHash,
      role: 'UI/UX Designer',
      department: 'Design',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    });

    const u5 = await User.create({
      name: 'Devon Taylor',
      email: 'devon@nova.app',
      password_hash: passwordHash,
      role: 'Fullstack Dev',
      department: 'Engineering',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    });

    // Create Projects
    const p1 = await Project.create({
      name: 'NOVA Mobile App v2.0',
      description: 'Next-gen mobile companion app providing real-time task notifications, offline sync, and mobile Kanban board.',
      status: 'Active',
      priority: 'High',
      category: 'Engineering',
      start_date: '2026-08-01',
      due_date: '2026-10-15',
      owner_id: u2._id,
      members: [u1._id, u2._id, u3._id, u4._id, u5._id],
    });

    const p2 = await Project.create({
      name: 'Cloud Infrastructure Migration',
      description: 'Migrate monolithic services into containerized Kubernetes pods with zero-downtime CI/CD pipelines.',
      status: 'Active',
      priority: 'Urgent',
      category: 'Operations',
      start_date: '2026-07-15',
      due_date: '2026-09-30',
      owner_id: u3._id,
      members: [u1._id, u3._id, u5._id],
    });

    const p3 = await Project.create({
      name: 'Design System & Token Library',
      description: 'Unified cross-platform UI components with WCAG AAA accessibility, dynamic dark mode, and design tokens.',
      status: 'Active',
      priority: 'Medium',
      category: 'Design',
      start_date: '2026-08-10',
      due_date: '2026-11-01',
      owner_id: u4._id,
      members: [u2._id, u4._id, u5._id],
    });

    // Create Tasks
    await Task.create({
      project_id: p1._id,
      title: 'Design Mobile Auth & SSO Screen',
      description: 'Figma mockups for biometric login, SSO with Google/Apple, and passwordless OTP flow.',
      status: 'Done',
      priority: 'High',
      assignee_id: u4._id,
      reporter_id: u2._id,
      due_date: '2026-08-20',
      estimated_hours: 16,
      tags: ['UI/UX', 'Auth'],
    });

    await Task.create({
      project_id: p1._id,
      title: 'Implement Push Notification Engine',
      description: 'Setup Firebase Cloud Messaging integration for real-time task updates on iOS/Android.',
      status: 'In Progress',
      priority: 'High',
      assignee_id: u3._id,
      reporter_id: u2._id,
      due_date: '2026-09-15',
      estimated_hours: 24,
      tags: ['Mobile', 'Backend'],
    });

    await Task.create({
      project_id: p1._id,
      title: 'Offline SQLite Storage Sync Layer',
      description: 'Persist offline task edits locally and auto-resolve sync conflicts when back online.',
      status: 'In Review',
      priority: 'Urgent',
      assignee_id: u5._id,
      reporter_id: u3._id,
      due_date: '2026-09-12',
      estimated_hours: 32,
      tags: ['Core', 'Database'],
    });

    await Task.create({
      project_id: p1._id,
      title: 'Gesture-based Drag & Drop Kanban',
      description: 'Build smooth touch drag gestures for moving task cards between swimlanes.',
      status: 'To Do',
      priority: 'Medium',
      assignee_id: u5._id,
      reporter_id: u4._id,
      due_date: '2026-09-22',
      estimated_hours: 20,
      tags: ['Mobile', 'Frontend'],
    });

    // Initial Activity Logs
    await ActivityLog.create({
      project_id: p1._id,
      user_id: u2._id,
      user_name: u2.name,
      user_avatar: u2.avatar_url,
      action: 'PROJECT_CREATED',
      details: `Created project "${p1.name}"`,
    });

    await ActivityLog.create({
      project_id: p1._id,
      user_id: u4._id,
      user_name: u4.name,
      user_avatar: u4.avatar_url,
      action: 'TASK_COMPLETED',
      details: `Completed task "Design Mobile Auth & SSO Screen"`,
    });

    await ActivityLog.create({
      project_id: p1._id,
      user_id: u5._id,
      user_name: u5.name,
      user_avatar: u5.avatar_url,
      action: 'STATUS_CHANGE',
      details: `Moved "Offline SQLite Storage Sync Layer" to In Review`,
    });

    console.log('🎉 MongoDB Atlas Seeding Complete!');
  } catch (err) {
    console.error('MongoDB auto-seed error:', err);
  }
}
