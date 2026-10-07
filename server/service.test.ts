import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from './db';
import { service } from './service';
import { today, addDays } from '../src/utils/dates';
import { seed } from './seed';
test('application, duplicate protection, stage history, outreach and repeat follow-ups', () => {
  const db = openDatabase(':memory:');
  const s = service(db);
  const id = s.createJob({
    company: 'Acme',
    title: 'Engineering Manager',
    stage: 'Applied',
    applied_date: today()
  });
  assert.throws(() => s.createJob({
    company: ' acme ',
    title: 'Engineering Manager'
  }), /Duplicate/);
  let data = (s.data() as any);
  assert.equal(data.followups.length, 1);
  assert.equal(data.followups[0].due_date, addDays(today(), 7));
  s.updateJob(id, {
    stage: 'Hiring Manager'
  });
  data = (s.data() as any);
  assert.ok(data.activities.some((a: any) => a.stage === 'Hiring Manager'));
  const contact = s.saveContact({
    job_id: id,
    name: 'Jane',
    first_contacted: today(),
    last_contacted: today()
  });
  data = (s.data() as any);
  assert.equal(data.followups.length, 2);
  assert.equal(data.followups[0].contact_id, contact);
  const f = data.followups[0];
  s.completeFollowup(f.id, true);
  data = (s.data() as any);
  assert.equal(data.followups.length, 3);
  assert.equal(data.followups.find((x: any) => x.id === f.id).completed, 1);
  s.completeFollowup(f.id, true);
  assert.equal((s.data() as any).followups.length, 3);
  s.saveContact({
    job_id: id,
    name: 'Jane',
    last_contacted: today()
  }, contact);
  assert.equal((s.data() as any).followups.length, 3);
  assert.throws(() => s.createJob({
    company: 'Acme2',
    title: 'EM',
    url: 'javascript:alert(1)'
  }), /URLs/);
  assert.throws(() => s.addFollowup({
    job_id: id,
    due_date: '2026-02-30'
  }), /valid date/);
  assert.throws(() => s.updateJob(id, {
    stage: 'Fake'
  }), /Invalid stage/);
  const id2 = s.createJob({
    company: 'Other',
    title: 'EM'
  });
  assert.throws(() => s.addFollowup({
    job_id: id2,
    contact_id: contact,
    due_date: today()
  }), /different job/);
  db.close();
});
test('newly applied jobs receive a date and automatic follow-up', () => {
  const db = openDatabase(':memory:');
  const s = service(db);
  const id = s.createJob({
    company: 'A',
    title: 'EM'
  });
  s.updateJob(id, {
    stage: 'Applied'
  });
  const data = (s.data() as any);
  assert.equal(data.jobs[0].applied_date, today());
  assert.equal(data.followups.length, 1);
  db.close();
});
test('SQLite persists after closing and reopening; backup includes every table', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tracker-test-'));
  const file = join(dir, 'db.sqlite');
  let db = openDatabase(file);
  seed(db);
  const s = service(db);
  const id = s.createJob({
    company: 'Persistence Co',
    title: 'Director'
  });
  s.addActivity({
    job_id: id,
    text: 'Retained note'
  });
  await db.backup(join(dir, 'backup.sqlite'));
  db.close();
  db = openDatabase(file);
  assert.equal((service(db).data() as any).jobs.length, 9);
  assert.ok((service(db).data() as any).activities.some((a: any) => a.text === 'Retained note'));
  db.close();
  const backup = openDatabase(join(dir, 'backup.sqlite'));
  assert.equal((service(backup).data() as any).jobs.length, 9);
  backup.close();
  rmSync(dir, {
    recursive: true,
    force: true
  });
});

test('Applied date supplied during a stage change adds exactly one follow-up', () => { const db=openDatabase(':memory:'); const s=service(db); const id=s.createJob({company:'Dates',title:'EM'}); s.updateJob(id,{stage:'Applied',applied_date:today()}); assert.equal((s.data() as any).followups.length,1); db.close(); });
