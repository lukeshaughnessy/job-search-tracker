import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { openDatabase } from './db';
import { service } from './service';
import { Editor } from '../src/components/Forms';
import { Applications } from '../src/pages/Applications';
import { Detail } from '../src/pages/Detail';
import { Dashboard } from '../src/pages/Dashboard';
import { seed } from './seed';
import type { Context } from '../src/pages/shared';

test('removing legacy priorities preserves applications and every related record across restarts and backup', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tracker-remove-priority-'));
  const path = join(dir, 'tracker.sqlite');
  let db = openDatabase(path);
  try {
    db.exec("ALTER TABLE jobs ADD COLUMN priority TEXT DEFAULT 'Medium'");
    const s = service(db);
    for (const priority of ['High', 'Medium', 'Low', '']) {
      const job = s.createJob({ company: (priority || 'Legacy') + ' Co', title: 'Manager', stage: 'Applied', notes: 'Keep notes' });
      db.prepare('UPDATE jobs SET priority=? WHERE id=?').run(priority, job);
      const contact = s.saveContact({ job_id: job, name: 'Recruiter' });
      s.saveInterview({ job_id: job, contact_id: contact, stage: 'Hiring Manager', starts_at: '2026-10-08T16:00:00.000Z', timezone: 'America/Denver', duration_minutes: 60, format: 'Video', status: 'Scheduled', notes: 'Keep interview notes' });
      s.addActivity({ job_id: job, contact_id: contact, text: 'Keep history' });
    }
    const expected = s.data();
    expected.jobs = expected.jobs.map(job => {
      const record = { ...job } as unknown as Record<string, unknown>;
      delete record.priority;
      return record as unknown as typeof job;
    });
    db.close();
    db = openDatabase(path);
    assert.deepEqual(service(db).data(), expected);
    assert.deepEqual(db.pragma('foreign_key_check'), []);
    const columns = db.prepare('PRAGMA table_info(jobs)').all() as { name: string }[];
    assert.ok(!columns.some(column => column.name === 'priority'));
    await db.backup(join(dir, 'backup.sqlite'));
    db.close();
    for (const file of [path, join(dir, 'backup.sqlite')]) {
      db = openDatabase(file);
      assert.deepEqual(service(db).data(), expected);
      db.close();
    }
    db = openDatabase(path);
    const migrated = service(db);
    migrated.updateJob(expected.jobs[0].id, { notes: 'Still editable', priority: 'High' });
    const id = migrated.createJob({ company: 'New Co', title: 'Director', priority: 'Low' });
    assert.ok(migrated.data().jobs.some(job => job.id === id));
    assert.equal(migrated.data().jobs.find(job => job.id === expected.jobs[0].id)?.notes, 'Still editable');
    for (const job of migrated.data().jobs) assert.ok(!('priority' in job));
    assert.doesNotMatch(JSON.stringify(migrated.data()), /"priority":/);
  } finally { db.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('forms, application list, details, and dashboard no longer display priority', () => {
  const db = openDatabase(':memory:');
  try {
    seed(db);
    const data = service(db).data();
    const ctx: Context = { data, openJob: () => {}, edit: () => {}, save: async () => {}, complete: () => {} };
    const job = data.jobs[0];
    const surfaces = [
      createElement(Editor, { kind: { type: 'job' }, data, save: async () => {}, close: () => {} }),
      createElement(Editor, { kind: { type: 'job', job }, data, save: async () => {}, close: () => {} }),
      createElement(Applications, { ctx, initialStage: '' }),
      createElement(Detail, { ctx, job, back: () => {} }),
      createElement(Dashboard, { ctx, filter: () => {}, calendar: () => {} })
    ];
    for (const surface of surfaces) assert.doesNotMatch(renderToStaticMarkup(surface), /priority|Worth your attention/i);
    const dashboard = renderToStaticMarkup(surfaces[4]);
    assert.match(dashboard, /Follow-ups &amp; Next Actions/);
    assert.match(dashboard, /Your pipeline/);
    assert.match(dashboard, /Interviews &amp; appointments/);
    for (const job of data.jobs) assert.ok(!('priority' in job));
  } finally { db.close(); }
});
