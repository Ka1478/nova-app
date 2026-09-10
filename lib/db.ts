import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const isVercel = !!process.env.VERCEL || process.env.NEXT_PHASE === 'phase-production-build';
const dbDir = isVercel ? '/tmp' : process.cwd();
const dbPath = path.join(dbDir, 'nova.db');

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const needsSeed = isVercel && (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0);
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);

    if (needsSeed) {
      autoSeedVercel(dbInstance);
    }
  }
  return dbInstance;
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

function autoSeedVercel(db: Database.Database) {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
    if (userCount > 0) return;

    const passwordHash = bcrypt.hashSync('password123', 10);
    const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, department, avatar_url) VALUES (?, ?, ?, ?, ?, ?)');
    const u1 = insertUser.run('Alex Morgan', 'alex@nova.app', passwordHash, 'Admin', 'Executive', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u2 = insertUser.run('Sophia Chen', 'sophia@nova.app', passwordHash, 'Product Manager', 'Product', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
    const u3 = insertUser.run('Marcus Vance', 'marcus@nova.app', passwordHash, 'Lead Engineer', 'Engineering', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;

    const insertProject = db.prepare('INSERT INTO projects (name, description, status, priority, category, start_date, due_date, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const p1 = insertProject.run('NOVA Mobile App v2.0', 'Next-gen mobile companion app providing real-time task notifications.', 'Active', 'High', 'Engineering', '2026-08-01', '2026-10-15', u2).lastInsertRowid as number;
    const p2 = insertProject.run('Cloud Infrastructure Migration', 'Migrate monolithic services into containerized Kubernetes pods.', 'Active', 'Urgent', 'Operations', '2026-07-15', '2026-09-30', u3).lastInsertRowid as number;

    const insertMember = db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)');
    [u1, u2, u3].forEach(uid => insertMember.run(p1, uid, 'Member'));
    [u1, u3].forEach(uid => insertMember.run(p2, uid, 'Member'));

    const insertTask = db.prepare('INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_hours, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertTask.run(p1, 'Design Mobile Auth & SSO Screen', 'Figma mockups for biometric login and SSO flow.', 'Done', 'High', u2, u1, '2026-08-20', 16, JSON.stringify(['UI/UX']));
    insertTask.run(p1, 'Implement Push Notification Engine', 'Firebase Cloud Messaging integration.', 'In Progress', 'High', u3, u2, '2026-09-15', 24, JSON.stringify(['Mobile']));

    const insertActivity = db.prepare('INSERT INTO activity_logs (project_id, user_id, action, details) VALUES (?, ?, ?, ?)');
    insertActivity.run(p1, u2, 'PROJECT_CREATED', 'Created project "NOVA Mobile App v2.0"');
  } catch (err) {
    console.error('Auto seed failed:', err);
  }
}

export default getDb;
