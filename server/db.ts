import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function openDatabase(path = process.env.DB_PATH || 'data/tracker.sqlite') {
  if (path !== ':memory:') mkdirSync(dirname(path), {
    recursive: true
  });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, company TEXT NOT NULL, title TEXT NOT NULL, url TEXT DEFAULT '', location TEXT DEFAULT '', work_mode TEXT DEFAULT 'Remote', compensation TEXT DEFAULT '', found_date TEXT DEFAULT '', applied_date TEXT DEFAULT '', source TEXT DEFAULT 'Other', referral TEXT DEFAULT '', description TEXT DEFAULT '', notes TEXT DEFAULT '', fit INTEGER DEFAULT 3 CHECK(fit BETWEEN 1 AND 5), interest INTEGER DEFAULT 3 CHECK(interest BETWEEN 1 AND 5), priority TEXT DEFAULT 'Medium', stage TEXT DEFAULT 'Interested', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, name TEXT NOT NULL, title TEXT DEFAULT '', company TEXT DEFAULT '', email TEXT DEFAULT '', linkedin TEXT DEFAULT '', relationship TEXT DEFAULT 'Other', first_contacted TEXT DEFAULT '', last_contacted TEXT DEFAULT '', notes TEXT DEFAULT '');
 CREATE TABLE IF NOT EXISTS followups (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, due_date TEXT NOT NULL, completed INTEGER DEFAULT 0 CHECK(completed IN (0,1)), type TEXT DEFAULT 'Application', notes TEXT DEFAULT '', next_action TEXT DEFAULT 'Check in on application');
 CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, kind TEXT NOT NULL, text TEXT NOT NULL, stage TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
