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
  db.exec(`CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, company TEXT NOT NULL, title TEXT NOT NULL, url TEXT DEFAULT '', location TEXT DEFAULT '', work_mode TEXT DEFAULT 'Remote', compensation TEXT DEFAULT '', found_date TEXT DEFAULT '', applied_date TEXT DEFAULT '', source TEXT DEFAULT 'Other', referral TEXT DEFAULT '', description TEXT DEFAULT '', notes TEXT DEFAULT '', stage TEXT DEFAULT 'Interested', created_at TEXT DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS contacts (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, name TEXT NOT NULL, title TEXT DEFAULT '', company TEXT DEFAULT '', email TEXT DEFAULT '', linkedin TEXT DEFAULT '', relationship TEXT DEFAULT 'Other', first_contacted TEXT DEFAULT '', last_contacted TEXT DEFAULT '', notes TEXT DEFAULT '');
 CREATE TABLE IF NOT EXISTS followups (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, due_date TEXT NOT NULL, completed INTEGER DEFAULT 0 CHECK(completed IN (0,1)), type TEXT DEFAULT 'Application', notes TEXT DEFAULT '', next_action TEXT DEFAULT 'Check in on application');
 CREATE TABLE IF NOT EXISTS activities (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, kind TEXT NOT NULL, text TEXT NOT NULL, stage TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
  const jobColumns = db.prepare('PRAGMA table_info(jobs)').all() as {name: string}[];
  db.transaction(() => {
    for (const field of ['fit', 'interest', 'priority']) {
      if (jobColumns.some(column => column.name === field)) db.exec(`ALTER TABLE jobs DROP COLUMN ${field}`);
    }
  })();
  const interviewSchema = `CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY, job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
    stage TEXT NOT NULL, starts_at TEXT NOT NULL, timezone TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK(duration_minutes BETWEEN 5 AND 1440),
    format TEXT NOT NULL DEFAULT 'Video', status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled','Completed','Cancelled')),
    contact_name TEXT DEFAULT '', contact_email TEXT DEFAULT '', contact_phone TEXT DEFAULT '',
    meeting_url TEXT DEFAULT '', location TEXT DEFAULT '', notes TEXT DEFAULT '', preparation TEXT DEFAULT '',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP, title TEXT NOT NULL DEFAULT '');`;
  db.exec(interviewSchema);
  const columns = db.prepare('PRAGMA table_info(interviews)').all() as {name: string; notnull: number}[];
  if (!columns.some(c => c.name === 'title')) db.exec("ALTER TABLE interviews ADD COLUMN title TEXT NOT NULL DEFAULT ''");
  if (columns.find(c => c.name === 'job_id')?.notnull) db.transaction(() => {
    db.exec(interviewSchema.replace('interviews (', 'interviews_new ('));
    const fields = [...columns.map(c => c.name), ...(columns.some(c => c.name === 'title') ? [] : ['title'])].join(',');
    db.exec(`INSERT INTO interviews_new (${fields}) SELECT ${fields} FROM interviews; DROP TABLE interviews; ALTER TABLE interviews_new RENAME TO interviews;`);
  })();
  db.exec('CREATE INDEX IF NOT EXISTS interviews_start ON interviews(starts_at)');
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
