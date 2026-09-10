import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    const totalProjects = (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count;
    const activeProjects = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'Active'").get() as any).count;
    const totalTasks = (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count;
    const completedTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Done'").get() as any).count;
    const activeTasks = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status IN ('To Do', 'In Progress', 'In Review')").get() as any).count;
    const totalMembers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;

    // Task status counts
    const statusCounts = db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `).all() as any[];

    // Priority counts
    const priorityCounts = db.prepare(`
      SELECT priority, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority
    `).all() as any[];

    // Project progress breakdown
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

    // Member workload
    const memberWorkload = db.prepare(`
      SELECT u.name, u.avatar_url,
             SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
             SUM(CASE WHEN t.status = 'To Do' THEN 1 ELSE 0 END) as to_do,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as done
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
    `).all();

    // Recent activity
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
