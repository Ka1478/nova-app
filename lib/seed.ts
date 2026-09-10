import getDb from './db';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  console.log('🌱 Starting NOVA database seeding...');
  const db = getDb();

  // Clear existing tables
  db.exec(`
    DELETE FROM activity_logs;
    DELETE FROM comments;
    DELETE FROM task_checklists;
    DELETE FROM tasks;
    DELETE FROM project_members;
    DELETE FROM projects;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, department, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const u1 = insertUser.run('Alex Morgan', 'alex@nova.app', passwordHash, 'Admin', 'Executive', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
  const u2 = insertUser.run('Sophia Chen', 'sophia@nova.app', passwordHash, 'Product Manager', 'Product', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
  const u3 = insertUser.run('Marcus Vance', 'marcus@nova.app', passwordHash, 'Lead Engineer', 'Engineering', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
  const u4 = insertUser.run('Elena Rostova', 'elena@nova.app', passwordHash, 'UI/UX Designer', 'Design', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;
  const u5 = insertUser.run('Devon Taylor', 'devon@nova.app', passwordHash, 'Fullstack Dev', 'Engineering', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80').lastInsertRowid as number;

  console.log('✅ Seed Users Created');

  // 2. Insert Seed Projects
  const insertProject = db.prepare(`
    INSERT INTO projects (name, description, status, priority, category, start_date, due_date, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const p1 = insertProject.run(
    'NOVA Mobile App v2.0',
    'Next-gen mobile companion app providing real-time task notifications, offline sync, and mobile Kanban board.',
    'Active',
    'High',
    'Engineering',
    '2026-08-01',
    '2026-10-15',
    u2
  ).lastInsertRowid as number;

  const p2 = insertProject.run(
    'Cloud Infrastructure Migration',
    'Migrate monolithic services into containerized Kubernetes pods with zero-downtime CI/CD pipelines.',
    'Active',
    'Urgent',
    'Operations',
    '2026-07-15',
    '2026-09-30',
    u3
  ).lastInsertRowid as number;

  const p3 = insertProject.run(
    'Design System & Token Library',
    'Unified cross-platform UI components with WCAG AAA accessibility, dynamic dark mode, and design tokens.',
    'Active',
    'Medium',
    'Design',
    '2026-08-10',
    '2026-11-01',
    u4
  ).lastInsertRowid as number;

  const p4 = insertProject.run(
    'Growth Marketing & Conversion Hub',
    'Revamp customer onboarding flow, SEO micro-sites, and real-time event analytics dashboard.',
    'Planning',
    'Low',
    'Marketing',
    '2026-09-01',
    '2026-12-15',
    u1
  ).lastInsertRowid as number;

  console.log('✅ Seed Projects Created');

  // 3. Insert Project Members
  const insertMember = db.prepare(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (?, ?, ?)
  `);

  // Project 1 members
  [u1, u2, u3, u4, u5].forEach(uid => insertMember.run(p1, uid, uid === u2 ? 'Owner' : 'Member'));
  // Project 2 members
  [u1, u3, u5].forEach(uid => insertMember.run(p2, uid, uid === u3 ? 'Owner' : 'Member'));
  // Project 3 members
  [u2, u4, u5].forEach(uid => insertMember.run(p3, uid, uid === u4 ? 'Owner' : 'Member'));
  // Project 4 members
  [u1, u2, u4].forEach(uid => insertMember.run(p4, uid, uid === u1 ? 'Owner' : 'Member'));

  console.log('✅ Project Members Added');

  // 4. Insert Seed Tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_hours, logged_hours, tags, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Project 1 Tasks
  const t1 = insertTask.run(p1, 'Design Mobile Auth & SSO Screen', 'Figma mockups for biometric login, SSO with Google/Apple, and passwordless OTP flow.', 'Done', 'High', u4, u2, '2026-08-20', 16, 18, JSON.stringify(['UI/UX', 'Auth']), 1).lastInsertRowid as number;
  const t2 = insertTask.run(p1, 'Implement Push Notification Engine', 'Setup Firebase Cloud Messaging integration for real-time task updates on iOS/Android.', 'In Progress', 'High', u3, u2, '2026-09-15', 24, 12, JSON.stringify(['Mobile', 'Backend']), 1).lastInsertRowid as number;
  const t3 = insertTask.run(p1, 'Offline SQLite Storage Sync Layer', 'Persist offline task edits locally and auto-resolve sync conflicts when back online.', 'In Review', 'Urgent', u5, u3, '2026-09-12', 32, 30, JSON.stringify(['Core', 'Database']), 1).lastInsertRowid as number;
  const t4 = insertTask.run(p1, 'Gesture-based Drag & Drop Kanban', 'Build smooth touch drag gestures for moving task cards between swimlanes.', 'To Do', 'Medium', u5, u4, '2026-09-22', 20, 0, JSON.stringify(['Mobile', 'Frontend']), 2).lastInsertRowid as number;
  const t5 = insertTask.run(p1, 'App Store & Play Store Assets', 'Generate app screenshots, feature graphic banners, and compliance disclosures.', 'Backlog', 'Low', u4, u2, '2026-10-05', 12, 0, JSON.stringify(['Design', 'Launch']), 1).lastInsertRowid as number;

  // Project 2 Tasks
  const t6 = insertTask.run(p2, 'Provision AWS EKS Clusters with Terraform', 'Infrastructure as Code scripts for multi-zone Kubernetes clusters with auto-scaling.', 'Done', 'Urgent', u3, u1, '2026-08-25', 40, 42, JSON.stringify(['DevOps', 'Cloud']), 1).lastInsertRowid as number;
  const t7 = insertTask.run(p2, 'Zero-Downtime Database Migration Script', 'Migrate production database schemas with live CDC streaming replication.', 'In Progress', 'Urgent', u3, u3, '2026-09-18', 36, 20, JSON.stringify(['Database', 'Migration']), 1).lastInsertRowid as number;
  const t8 = insertTask.run(p2, 'Setup Prometheus & Grafana Monitoring', 'Configure telemetry, error budget tracking, and real-time Slack incident alerts.', 'To Do', 'High', u5, u3, '2026-09-25', 16, 0, JSON.stringify(['DevOps', 'Observability']), 1).lastInsertRowid as number;

  // Project 3 Tasks
  const t9 = insertTask.run(p3, 'Accessible Button & Input Primitives', 'Build React component library for form fields with ARIA labels and focus rings.', 'Done', 'Medium', u4, u2, '2026-08-30', 20, 20, JSON.stringify(['Design System', 'a11y']), 1).lastInsertRowid as number;
  const t10 = insertTask.run(p3, 'Dark & Light Theme Color Tokens', 'Define CSS variables and Tailwind preset for seamless theme toggling across apps.', 'In Progress', 'Medium', u4, u4, '2026-09-14', 12, 8, JSON.stringify(['Design System', 'CSS']), 1).lastInsertRowid as number;

  console.log('✅ Seed Tasks Created');

  // 5. Insert Task Checklists
  const insertChecklist = db.prepare(`
    INSERT INTO task_checklists (task_id, title, is_completed)
    VALUES (?, ?, ?)
  `);

  insertChecklist.run(t2, 'Setup Firebase Admin SDK', 1);
  insertChecklist.run(t2, 'Configure iOS APNs Certificates', 1);
  insertChecklist.run(t2, 'Configure Android FCM Credentials', 0);
  insertChecklist.run(t2, 'Build Notification Settings UI', 0);

  insertChecklist.run(t3, 'Implement IndexedDB/SQLite local store', 1);
  insertChecklist.run(t3, 'Write optimistic UI update handlers', 1);
  insertChecklist.run(t3, 'Create diff-merge resolution engine', 0);

  console.log('✅ Task Checklists Created');

  // 6. Insert Comments
  const insertComment = db.prepare(`
    INSERT INTO comments (task_id, user_id, content, created_at)
    VALUES (?, ?, ?, ?)
  `);

  insertComment.run(t2, u2, 'Great progress on this! Make sure we include user preference toggles for quiet hours.', '2026-09-08 10:15:00');
  insertComment.run(t2, u3, 'Thanks Sophia! The FCM backend endpoints are ready. Working on APNs certs now.', '2026-09-08 11:30:00');
  insertComment.run(t3, u5, 'The offline mutation queue is working smoothly on test devices. Ready for code review.', '2026-09-09 14:20:00');
  insertComment.run(t3, u3, 'Reviewed the PR. Outstanding work on the conflict resolver!', '2026-09-09 16:45:00');

  console.log('✅ Comments Created');

  // 7. Insert Activity Logs
  const insertActivity = db.prepare(`
    INSERT INTO activity_logs (project_id, task_id, user_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertActivity.run(p1, t3, u5, 'STATUS_CHANGE', 'Moved task "Offline SQLite Storage Sync Layer" from In Progress to In Review', '2026-09-09 14:18:00');
  insertActivity.run(p1, t2, u3, 'COMMENT_ADDED', 'Added a comment to "Implement Push Notification Engine"', '2026-09-08 11:30:00');
  insertActivity.run(p2, t6, u3, 'TASK_COMPLETED', 'Completed task "Provision AWS EKS Clusters with Terraform"', '2026-08-25 17:00:00');
  insertActivity.run(p1, null, u2, 'PROJECT_CREATED', 'Created new project "NOVA Mobile App v2.0"', '2026-08-01 09:00:00');
  insertActivity.run(p3, t9, u4, 'TASK_COMPLETED', 'Completed task "Accessible Button & Input Primitives"', '2026-08-30 16:00:00');

  console.log('✅ Activity Logs Created');
  console.log('🎉 NOVA Database Seeding Complete!');
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}
