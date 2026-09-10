import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import connectMongoDB from '@/lib/mongodb';
import Project from '@/models/Project';
import Task from '@/models/Task';
import User from '@/models/User';
import ActivityLog from '@/models/ActivityLog';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function GET(req: NextRequest) {
  try {
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();

      const projects = await Project.find().lean();
      const tasks = await Task.find().lean();
      const users = await User.find().lean();

      const totalProjects = projects.length;
      const activeProjects = projects.filter((p: any) => p.status === 'Active').length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'Done').length;
      const activeTasks = tasks.filter((t: any) => ['To Do', 'In Progress', 'In Review'].includes(t.status)).length;
      const totalMembers = users.length;

      const statusMap: Record<string, number> = {};
      const priorityMap: Record<string, number> = {};

      tasks.forEach((t: any) => {
        const s = t.status || 'To Do';
        const p = t.priority || 'Medium';
        statusMap[s] = (statusMap[s] || 0) + 1;
        priorityMap[p] = (priorityMap[p] || 0) + 1;
      });

      const statusCounts = Object.entries(statusMap).map(([status, count]) => ({ status, count }));
      const priorityCounts = Object.entries(priorityMap).map(([priority, count]) => ({ priority, count }));

      const projectsWithProgress = projects.map((p: any) => {
        const pTasks = tasks.filter((t: any) => t.project_id?.toString() === p._id.toString());
        const tTotal = pTasks.length;
        const tDone = pTasks.filter((t: any) => t.status === 'Done').length;
        return {
          id: p._id.toString(),
          name: p.name,
          category: p.category,
          status: p.status,
          priority: p.priority,
          total_tasks: tTotal,
          completed_tasks: tDone,
          progress: tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0,
        };
      });

      const memberWorkload = users.map((u: any) => {
        const uTasks = tasks.filter((t: any) => t.assignee_id?.toString() === u._id.toString());
        return {
          name: u.name,
          avatar_url: u.avatar_url,
          in_progress: uTasks.filter((t: any) => t.status === 'In Progress').length,
          to_do: uTasks.filter((t: any) => t.status === 'To Do').length,
          done: uTasks.filter((t: any) => t.status === 'Done').length,
        };
      });

      const recentActivityLogs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean();
      const recentActivity = recentActivityLogs.map((log: any) => ({
        id: log._id.toString(),
        action: log.action,
        details: log.details,
        user_name: log.user_name || 'User',
        user_avatar: log.user_avatar,
        created_at: log.createdAt,
      }));

      return NextResponse.json({
        summary: {
          totalProjects,
          activeProjects,
          totalTasks,
          completedTasks,
          activeTasks,
          totalMembers,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
        statusCounts,
        priorityCounts,
        projectsWithProgress,
        memberWorkload,
        recentActivity,
      });
    }

    // SQLite Fallback
    const db = getDb();

    const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;
    const activeProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Active'").get() as any).count;
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Done'").get() as any).count;
    const activeTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('To Do', 'In Progress', 'In Review')").get() as any).count;
    const totalMembers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;

    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `).all() as any[];

    const priorityCounts = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority
    `).all() as any[];

    const projectBreakdown = db.prepare(`
      SELECT p.id, p.name, p.category, p.status, p.priority,
             COUNT(t.id) as total_tasks,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
    `).all() as any[];

    const projectsWithProgress = projectBreakdown.map(p => ({
      ...p,
      progress: p.total_tasks > 0 ? Math.round((p.completed_tasks / p.total_tasks) * 100) : 0
    }));

    const memberWorkload = db.prepare(`
      SELECT u.name, u.avatar_url,
             SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
             SUM(CASE WHEN t.status = 'To Do' THEN 1 ELSE 0 END) as to_do,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as done
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
    `).all();

    const recentActivity = db.prepare(`
      SELECT al.*, u.name as user_name, u.avatar_url as user_avatar, p.name as project_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      LEFT JOIN projects p ON al.project_id = p.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `).all();

    return NextResponse.json({
      summary: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        activeTasks,
        totalMembers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      statusCounts,
      priorityCounts,
      projectsWithProgress,
      memberWorkload,
      recentActivity,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
