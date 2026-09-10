import Database from 'better-sqlite3';
import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const isVercel = !!process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build';
const dataDir = process.env.DATA_DIR || (isVercel ? '/tmp' : process.cwd());
const dbPath = path.join(dataDir, 'nova.db');

let betterDbInstance: Database.Database | null = null;
let tursoClientInstance: Client | null = null;

const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

export function getDb(): Database.Database {
  if (!betterDbInstance) {
    betterDbInstance = new Database(dbPath);
    betterDbInstance.pragma('journal_mode = WAL');
    betterDbInstance.pragma('foreign_keys = ON');
    initTables(betterDbInstance);

    const userCount = (betterDbInstance.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    if (userCount === 0) {
      autoSeed(betterDbInstance);
    }
  }
  return betterDbInstance;
}

export function getTursoClient(): Client | null {
  if (tursoUrl) {
    if (!tursoClientInstance) {
      tursoClientInstance = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      });
    }
    return tursoClientInstance;
  }
  return null;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      department TEXT DEFAULT 'Engineering',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      priority TEXT NOT NULL DEFAULT 'Medium',
      category TEXT NOT NULL DEFAULT 'Engineering',
      start_date TEXT,
      due_date TEXT,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'Member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'To Do',
      priority TEXT NOT NULL DEFAULT 'Medium',
      assignee_id INTEGER,
      reporter_id INTEGER,
      due_date TEXT,
      estimated_hours REAL DEFAULT 0,
      logged_hours REAL DEFAULT 0,
      tags TEXT DEFAULT '[]',
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS task_checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      task_id INTEGER,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function autoSeed(db: Database.Database) {
  try {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, department, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');

    const u1 = insertUser.run('Alex Morgan', 'alex@nova.app', passwordHash, 'Admin', 'Executive', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u2 = insertUser.run('Sophia Chen', 'sophia@nova.app', passwordHash, 'Product Manager', 'Product', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u3 = insertUser.run('Marcus Vance', 'marcus@nova.app', passwordHash, 'Lead Engineer', 'Engineering', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u4 = insertUser.run('Elena Rostova', 'elena@nova.app', passwordHash, 'UI/UX Designer', 'Design', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u5 = insertUser.run('Devon Taylor', 'devon@nova.app', passwordHash, 'Fullstack Dev', 'Engineering', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;

    const insertProject = db.prepare('INSERT INTO projects (name, description, status, priority, category, start_date, due_date, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const p1 = insertProject.run('NOVA Mobile App v2.0', 'Next-gen mobile companion app providing real-time task notifications, offline sync, and mobile Kanban board.', 'Active', 'High', 'Engineering', '2026-08-01', '2026-10-15', u2).lastInsertRowid as number;
    const p2 = insertProject.run('Cloud Infrastructure Migration', 'Migrate monolithic services into containerized Kubernetes pods with zero-downtime CI/CD pipelines.', 'Active', 'Urgent', 'Operations', '2026-07-15', '2026-09-30', u3).lastInsertRowid as number;
    const p3 = insertProject.run('Design System & Token Library', 'Unified cross-platform UI components with WCAG AAA accessibility, dynamic dark mode, and design tokens.', 'Active', 'Medium', 'Design', '2026-08-10', '2026-11-01', u4).lastInsertRowid as number;
    const p4 = insertProject.run('Growth Marketing & Conversion Hub', 'Revamp customer onboarding flow, SEO micro-sites, and real-time event analytics dashboard.', 'Planning', 'Low', 'Marketing', '2026-09-01', '2026-12-15', u1).lastInsertRowid as number;

    const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
    [u1, u2, u3, u4, u5].forEach(uid => insertMember.run(p1, uid, uid === u2 ? 'Owner' : 'Member'));
    [u1, u3, u5].forEach(uid => insertMember.run(p2, uid, uid === u3 ? 'Owner' : 'Member'));
    [u2, u4, u5].forEach(uid => insertMember.run(p3, uid, uid === u4 ? 'Owner' : 'Member'));
    [u1, u2, u4].forEach(uid => insertMember.run(p4, uid, uid === u1 ? 'Owner' : 'Member'));

    const insertTask = db.prepare('INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_hours, logged_hours, tags, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const t1 = insertTask.run(p1, 'Design Mobile Auth & SSO Screen', 'Figma mockups for biometric login, SSO with Google/Apple, and passwordless OTP flow.', 'Done', 'High', u4, u2, '2026-08-20', 16, 18, JSON.stringify(['UI/UX', 'Auth']), 1).lastInsertRowid as number;
    const t2 = insertTask.run(p1, 'Implement Push Notification Engine', 'Setup Firebase Cloud Messaging integration for real-time task updates on iOS/Android.', 'In Progress', 'High', u3, u2, '2026-09-15', 24, 12, JSON.stringify(['Mobile', 'Backend']), 1).lastInsertRowid as number;
    const t3 = insertTask.run(p1, 'Offline SQLite Storage Sync Layer', 'Persist offline task edits locally and auto-resolve sync conflicts when back online.', 'In Review', 'Urgent', u5, u3, '2026-09-12', 32, 30, JSON.stringify(['Core', 'Database']), 1).lastInsertRowid as number;
    const t4 = insertTask.run(p1, 'Gesture-based Drag & Drop Kanban', 'Build smooth touch drag gestures for moving task cards between swimlanes.', 'To Do', 'Medium', u5, u4, '2026-09-22', 20, 0, JSON.stringify(['Mobile', 'Frontend']), 2).lastInsertRowid as number;

    const insertComment = db.prepare('INSERT INTO comments (task_id, user_id, content, created_at) VALUES (?, ?, ?, ?)');
    insertComment.run(t2, u2, 'Great progress on this! Make sure we include user preference toggles for quiet hours.', '2026-09-08 10:15:00');
    insertComment.run(t2, u3, 'Thanks Sophia! The FCM backend endpoints are ready. Working on APNs certs now.', '2026-09-08 11:30:00');

    const insertActivity = db.prepare('INSERT INTO activity_logs (project_id, task_id, user_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    insertActivity.run(p1, t3, u5, 'STATUS_CHANGE', 'Moved task "Offline SQLite Storage Sync Layer" from In Progress to In Review', '2026-09-09 14:18:00');
    insertActivity.run(p1, t2, u3, 'COMMENT_ADDED', 'Added a comment to "Implement Push Notification Engine"', '2026-09-08 11:30:00');
  } catch (err) {
    console.error('Auto seed failed:', err);
  }
}

export default getDb;
