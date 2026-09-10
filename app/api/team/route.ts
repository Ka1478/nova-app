import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import { autoSeedMongoDB } from '@/lib/seedMongo';

export async function GET(req: NextRequest) {
  try {
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
      await autoSeedMongoDB();
      const users = await User.find().lean();
      const tasks = await Task.find().lean();

      const team = users.map((u: any) => {
        const userTasks = tasks.filter((t: any) => t.assignee_id?.toString() === u._id.toString());
        const activeTasks = userTasks.filter((t: any) => t.status === 'In Progress').length;
        const completedTasks = userTasks.filter((t: any) => t.status === 'Done').length;

        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          avatar_url: u.avatar_url,
          assigned_tasks: userTasks.length,
          active_tasks: activeTasks,
          completed_tasks: completedTasks,
        };
      });

      return NextResponse.json({ users: team });
    }

    // SQLite Fallback
    const db = getDb();
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.department, u.avatar_url, u.created_at,
             COUNT(t.id) as assigned_tasks,
             SUM(CASE WHEN t.status = 'In Progress' THEN 1 ELSE 0 END) as active_tasks,
             SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) as completed_tasks
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY u.name ASC
    `).all() as any[];

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
