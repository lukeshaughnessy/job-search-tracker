import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { priorities } from '../shared/models';
import { openDatabase } from './db';
import { service } from './service';
import { Editor } from '../src/components/Forms';
import { Applications } from '../src/pages/Applications';
import type { Context } from '../src/pages/shared';

test('each priority can be created, edited, and retained after reopening SQLite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tracker-priority-'));
  const path = join(dir, 'tracker.sqlite');
  let db = openDatabase(path);
  try {
    const s = service(db);
    for (const priority of priorities) {
      const id = s.createJob({ company: priority + ' Co', title: 'Manager', priority });
      assert.equal(s.data().jobs.find(j => j.id === id)?.priority, priority);
      for (const next of priorities) {
        s.updateJob(id, { priority: next });
        assert.equal(s.data().jobs.find(j => j.id === id)?.priority, next);
      }
      s.updateJob(id, { priority });
    }
    const before = s.data();
    db.close();
    db = openDatabase(path);
    assert.deepEqual(service(db).data(), before);
  } finally { db.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('default and legacy empty priorities work; invalid priorities cannot change saved records', () => {
  const db = openDatabase(':memory:');
  try {
    const s = service(db);
    const id = s.createJob({ company: 'Default Co', title: 'Manager', stage: 'Applied' });
    assert.equal(s.data().jobs[0].priority, 'Medium');
    const legacy = s.createJob({ company: 'Legacy Co', title: 'Director', priority: '' });
    s.updateJob(legacy, { notes: 'Existing application still works' });
    assert.equal(s.data().jobs[0].priority, '');
    const before = s.data();
    for (const priority of ['Urgent', 'high', null, false, 0, [], {}]) {
      assert.throws(() => s.createJob({ company: 'Invalid Co', title: 'Manager', priority }));
      assert.throws(() => s.updateJob(id, { priority, stage: 'Offer' }));
      assert.deepEqual(s.data(), before);
    }
    s.updateJob(legacy, { priority: 'High' });
    assert.equal(s.data().jobs.find(j => j.id === legacy)?.priority, 'High');
    assert.equal(s.data().followups.length, 1);
  } finally { db.close(); }
});

test('create/edit forms expose all priorities and application list displays saved priorities', () => {
  const db = openDatabase(':memory:');
  try {
    const s = service(db);
    for (const priority of [...priorities, '']) s.createJob({ company: (priority || 'Legacy') + ' Co', title: 'Manager', priority });
    const data = s.data();
    const renderForm = (job?: typeof data.jobs[number]) => renderToStaticMarkup(createElement(Editor, {
      kind: { type: 'job', job }, data, save: async () => {}, close: () => {}
    })).match(/<span>Priority<\/span><select>(.*?)<\/select>/)?.[1];
    for (const job of [undefined, ...data.jobs]) {
      const field = renderForm(job);
      assert.ok(field);
      for (const priority of priorities) assert.ok(field.includes(`value="${priority}"`));
      const selected = job ? job.priority : 'Medium';
      assert.ok(field.includes(`value="${selected}" selected=""`));
    }
    const ctx: Context = { data, openJob: () => {}, edit: () => {}, save: async () => {}, complete: () => {} };
    const list = renderToStaticMarkup(createElement(Applications, { ctx, initialStage: '' }));
    for (const priority of priorities) assert.ok(list.includes(`<small>${priority} priority</small>`));
    assert.match(list, /<small>No priority<\/small>/);
    assert.match(list, /Legacy Co/);
  } finally { db.close(); }
});
