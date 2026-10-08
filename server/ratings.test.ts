import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { openDatabase } from './db';
import { service } from './service';
import { Applications } from '../src/pages/Applications';
import { Detail } from '../src/pages/Detail';
import { Dashboard } from '../src/pages/Dashboard';
import { Editor } from '../src/components/Forms';
import type { Context } from '../src/pages/shared';

test('legacy ratings migrate without losing applications or related records', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tracker-ratings-'));
  const file = join(dir, 'legacy.sqlite');
  let db = openDatabase(file);
  try {
    db.exec('ALTER TABLE jobs ADD COLUMN fit INTEGER DEFAULT 3 CHECK(fit BETWEEN 1 AND 5); ALTER TABLE jobs ADD COLUMN interest INTEGER DEFAULT 3 CHECK(interest BETWEEN 1 AND 5)');
    const s = service(db);
    const id = s.createJob({ company: 'Legacy Co', title: 'Manager', stage: 'Applied', notes: 'Keep this' });
    db.prepare('UPDATE jobs SET fit=5, interest=4 WHERE id=?').run(id);
    s.saveContact({ job_id: id, name: 'Recruiter' });
    const before = s.data();
    db.close();
    db = openDatabase(file);
    const migrated = service(db);
    const after = migrated.data();
    const expected = { ...before.jobs[0] } as unknown as Record<string, unknown>;
    delete expected.fit;
    delete expected.interest;
    assert.deepEqual(after.jobs[0], expected);
    assert.deepEqual(after.contacts, before.contacts);
    assert.deepEqual(after.followups, before.followups);
    assert.deepEqual(after.activities, before.activities);
    const columns = db.prepare('PRAGMA table_info(jobs)').all() as { name: string }[];
    assert.ok(!columns.some(c => ['fit', 'interest'].includes(c.name)));
    migrated.updateJob(id, { notes: 'Updated', fit: 5, interest: 4 });
    const created = migrated.createJob({ company: 'New Co', title: 'Director', fit: 4, interest: 5 });
    assert.equal(migrated.data().jobs.find(j => j.id === id)?.notes, 'Updated');
    for (const job of migrated.data().jobs) {
      assert.ok(!('fit' in job));
      assert.ok(!('interest' in job));
    }
    assert.ok(migrated.data().jobs.some(j => j.id === created));
    db.close();
    db = openDatabase(file);
    assert.equal(service(db).data().jobs.length, 2);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('application surfaces omit ratings', () => {
  const db = openDatabase(':memory:');
  try {
    const s = service(db);
    s.createJob({ company: 'Application Co', title: 'Manager' });
    s.createJob({ company: 'Other Co', title: 'Director' });
    const data = s.data();
    const ctx: Context = { data, openJob: () => {}, edit: () => {}, save: async () => {}, complete: () => {} };
    const job = data.jobs[0];
    const surfaces = [
      createElement(Applications, { ctx, initialStage: '' }),
      createElement(Detail, { ctx, job, back: () => {} }),
      createElement(Dashboard, { ctx, filter: () => {}, calendar: () => {} }),
      createElement(Editor, { kind: { type: 'job' }, data, save: async () => {}, close: () => {} }),
      createElement(Editor, { kind: { type: 'job', job }, data, save: async () => {}, close: () => {} })
    ];
    for (const surface of surfaces) {
      const html = renderToStaticMarkup(surface);
      assert.doesNotMatch(html, /\bFit\b|\bInterest\b|Any fit|out of 5|class="rating"/);
    }
  } finally { db.close(); }
});
