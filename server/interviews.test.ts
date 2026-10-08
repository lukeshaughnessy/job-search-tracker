import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from './db';
import { service } from './service';
import { localAppointmentISO, interviewDate } from '../src/utils/interviews';
const appointment = {stage:'Phone Screen', starts_at:'2026-10-08T16:00:00.000Z',timezone:'America/Denver',duration_minutes:45,format:'Video',status:'Scheduled',meeting_url:'https://example.com/meeting',notes:'Ask about team growth',preparation:'Review platform architecture'};
test('schedule, reschedule, complete and cancel interviews without changing the application stage', () => {
  const db=openDatabase(':memory:');const s=service(db);
  const job=s.createJob({company:'Scheduling Co',title:'Director',stage:'Applied'});
  const contact=s.saveContact({job_id:job,name:'Alex',email:'alex@example.com'});
  const id=s.saveInterview({...appointment,job_id:job,contact_id:contact,contact_name:'Alex'});
  s.saveInterview({starts_at:'2026-10-09T17:00:00.000Z',stage:'Hiring Manager'},id);
  s.saveInterview({status:'Completed'},id);
  const second=s.saveInterview({...appointment,job_id:job});s.saveInterview({status:'Cancelled'},second);
  const data=s.data();assert.equal(data.interviews.length,2);assert.equal(data.interviews.find(i=>i.id===id)?.status,'Completed');
  assert.equal(data.jobs[0].stage,'Applied');assert.equal(data.activities.filter(a=>a.kind==='interview').length,5);
  assert.ok(data.activities.some(a=>a.kind==='interview' && a.text.includes('Cancelled')));db.close();
});
test('invalid interview details and contacts from other jobs are rejected transactionally',()=>{
  const db=openDatabase(':memory:');const s=service(db);const job=s.createJob({company:'A',title:'EM'});const other=s.createJob({company:'B',title:'EM'});const contact=s.saveContact({job_id:other,name:'Other'});
  for (const invalid of [{starts_at:'2026-02-30T10:00:00.000Z'},{duration_minutes:0},{duration_minutes:3.5},{timezone:'Not/AZone'},{timezone:''},{status:'Fake'},{stage:'Fake'},{format:'Fake'},{meeting_url:'javascript:alert(1)'},{contact_id:contact},{notes:3}]) assert.throws(()=>s.saveInterview({...appointment,job_id:job,...invalid}));
  assert.equal(s.data().interviews.length,0);const id=s.saveInterview({...appointment,job_id:job});assert.throws(()=>s.saveInterview({job_id:other},id));assert.equal(s.data().interviews[0].job_id,job);db.close();
});
test('existing database gains interview storage, survives reopening, and includes interviews in backup',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'tracker-interviews-'));const file=join(dir,'db.sqlite');let db=openDatabase(file);
  const job=service(db).createJob({company:'Existing data',title:'EM'});db.exec('DROP TABLE interviews');db.close();
  db=openDatabase(file);assert.equal(service(db).data().jobs[0].company,'Existing data');service(db).saveInterview({...appointment,job_id:job});await db.backup(join(dir,'backup.sqlite'));db.close();
  db=openDatabase(file);assert.equal(service(db).data().interviews.length,1);db.close();db=openDatabase(join(dir,'backup.sqlite'));assert.equal(service(db).data().interviews[0].notes,appointment.notes);db.close();rmSync(dir,{recursive:true,force:true});
});
test('local date/time round trips and invalid calendar dates are rejected',()=>{
  const starts_at=localAppointmentISO('2026-10-08','10:30');assert.equal(interviewDate({...appointment,id:1,job_id:1,contact_id:null,contact_name:'',contact_email:'',contact_phone:'',location:'',created_at:'',starts_at}),'2026-10-08');
  assert.throws(()=>localAppointmentISO('2026-02-30','10:30'));assert.throws(()=>localAppointmentISO('2026-10-08','25:00'));
});

 test('standalone appointments need no jobs, retain notes after restart and backup, and require a title', async () => {
  const dir=mkdtempSync(join(tmpdir(),'tracker-standalone-'));const file=join(dir,'db.sqlite');let db=openDatabase(file);let s=service(db);
  assert.throws(()=>s.saveInterview({...appointment,job_id:null}),/title/);
  const id=s.saveInterview({...appointment,job_id:null,title:'Career coaching',contact_name:'Pat',contact_phone:'555-0100'});
  s.saveInterview({status:'Completed',notes:'Discussed next steps'},id);
  assert.equal(s.data().jobs.length,0);assert.equal(s.data().activities.length,0);await db.backup(join(dir,'backup.sqlite'));db.close();
  for(const name of ['db.sqlite','backup.sqlite']){db=openDatabase(join(dir,name));s=service(db);assert.equal(s.data().interviews[0].job_id,null);assert.equal(s.data().interviews[0].title,'Career coaching');assert.equal(s.data().interviews[0].notes,'Discussed next steps');db.close();}rmSync(dir,{recursive:true,force:true});
});
test('migration preserves old interview IDs, fields, and contact relationships while allowing standalone appointments',()=>{
  const dir=mkdtempSync(join(tmpdir(),'tracker-migration-'));const file=join(dir,'db.sqlite');let db=openDatabase(file);const s=service(db);const job=s.createJob({company:'Keep me',title:'EM'});const contact=s.saveContact({job_id:job,name:'Alex'});const id=s.saveInterview({...appointment,job_id:job,contact_id:contact});
  db.exec(`CREATE TABLE legacy_interviews AS SELECT * FROM interviews; DROP TABLE interviews; CREATE TABLE interviews (id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE, contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL, stage TEXT NOT NULL, starts_at TEXT NOT NULL, timezone TEXT NOT NULL, duration_minutes INTEGER, format TEXT, status TEXT, contact_name TEXT, contact_email TEXT, contact_phone TEXT, meeting_url TEXT, location TEXT, notes TEXT, preparation TEXT, created_at TEXT); INSERT INTO interviews SELECT id,job_id,contact_id,stage,starts_at,timezone,duration_minutes,format,status,contact_name,contact_email,contact_phone,meeting_url,location,notes,preparation,created_at FROM legacy_interviews; DROP TABLE legacy_interviews;`);db.close();
  db=openDatabase(file);const migrated=service(db);assert.equal(migrated.data().interviews[0].id,id);assert.equal(migrated.data().interviews[0].contact_id,contact);assert.equal(migrated.data().interviews[0].notes,appointment.notes);migrated.saveInterview({...appointment,job_id:null,title:'Practice interview'});assert.equal(migrated.data().interviews.length,2);assert.deepEqual(db.pragma('foreign_key_check'),[]);db.close();rmSync(dir,{recursive:true,force:true});
});
