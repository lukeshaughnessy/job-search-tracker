import { useState } from 'react';
import { interviewStages, type Data } from '../../shared/models';
import type { FormKind } from './Forms';
import { Field } from './UI';
import { today } from '../utils/dates';
import { interviewDate, localAppointmentISO, localTimezone } from '../utils/interviews';
export function InterviewForm({ kind, data, save, close }: { kind: Extract<FormKind, { type: 'interview' }>; data: Data; save: (path: string, body: any, method?: string) => Promise<void>; close: () => void }) {
  const existing = kind.interview;
  const start = existing ? new Date(existing.starts_at) : null;
  const [value, setValue] = useState({ job_id: existing ? existing.job_id || '' : kind.job?.id || '', contact_id: existing?.contact_id || null,
    title: existing?.title || '',
    stage: existing?.stage || (interviewStages.includes(kind.job?.stage as typeof interviewStages[number]) ? kind.job!.stage : 'Phone Screen'),
    date: existing ? interviewDate(existing) : kind.date || today(), time: start ? `${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}` : '10:00',
    duration_minutes: existing?.duration_minutes || 60, format: existing?.format || 'Video', status: existing?.status || 'Scheduled',
    contact_name: existing?.contact_name || '', contact_email: existing?.contact_email || '', contact_phone: existing?.contact_phone || '',
    meeting_url: existing?.meeting_url || '', location: existing?.location || '', notes: existing?.notes || '', preparation: existing?.preparation || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const field = (key: 'title'|'date'|'time'|'contact_name'|'contact_email'|'contact_phone'|'meeting_url'|'location', label: string, type = 'text', required = false) => <Field label={label}><input required={required} type={type} value={value[key]} onChange={e => setValue({...value, [key]: e.target.value})} /></Field>;
  const select = (key: 'stage'|'format'|'status', label: string, options: readonly string[]) => <Field label={label}><select value={value[key]} onChange={e => setValue({...value, [key]: e.target.value})}>{options.map(o => <option key={o}>{o}</option>)}</select></Field>;
  return <form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const {date, time, ...fields} = value;
      await save('interviews' + (existing ? '/' + existing.id : ''), { ...fields, job_id: value.job_id ? Number(value.job_id) : null, stage: value.job_id ? value.stage : 'Other', starts_at: localAppointmentISO(date,time), timezone: localTimezone() }, existing ? 'PATCH' : 'POST');
      close();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }}><div className="form-grid">
    <Field label="Application (optional)" wide><select disabled={!!existing} value={value.job_id} onChange={e => setValue({...value, job_id: e.target.value ? Number(e.target.value) : '', contact_id: null, contact_name:'',contact_email:'',contact_phone:''})}><option value="">Standalone appointment — no application</option>{data.jobs.map(j => <option key={j.id} value={j.id}>{j.company} · {j.title}</option>)}</select></Field>
    {!value.job_id && field('title','Appointment title','text',true)}
    {value.job_id ? select('stage','Interview stage',interviewStages) : null}{select('format','Format',['Phone','Video','In person','Other'])}
    {field('date','Appointment date','date',true)}{field('time','Start time','time',true)}
    <p className="form-hint wide">Times are shown in your computer’s time zone: <strong>{localTimezone()}</strong>. Appointments retain their exact time when your computer’s time zone changes.</p>
    <Field label="Duration (minutes)"><input type="number" required min="5" max="1440" step="1" value={value.duration_minutes} onChange={e => setValue({...value,duration_minutes:Number(e.target.value)})} /></Field>{select('status','Appointment status',['Scheduled','Completed','Cancelled'])}
    {value.job_id ? <Field label="Associated contact" wide><select value={value.contact_id || ''} onChange={e => { const contact = data.contacts.find(c => c.id === Number(e.target.value)); setValue({...value,contact_id:contact?.id || null,contact_name:contact?.name || '',contact_email:contact?.email || '',contact_phone:''}); }}><option value="">Enter contact information below</option>{data.contacts.filter(c => c.job_id === Number(value.job_id)).map(c => <option key={c.id} value={c.id}>{c.name} · {c.title || c.relationship}</option>)}</select></Field> : null}
    {field('contact_name','Contact / interviewer name')}{field('contact_email','Contact email','email')}{field('contact_phone','Phone / dial-in number','tel')}{field('meeting_url','Meeting link','url')}{field('location','Location / address')}
    <Field label="Preparation / agenda" wide><textarea rows={3} value={value.preparation} onChange={e => setValue({...value,preparation:e.target.value})} placeholder="Topics to prepare, interviewers, questions to ask…" /></Field>
    <Field label="Notes" wide><textarea rows={4} value={value.notes} onChange={e => setValue({...value,notes:e.target.value})} placeholder="Meeting passcode, logistics, interview notes…" /></Field>
  </div>{error && <div className="form-error" role="alert">{error}</div>}<footer className="form-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : existing ? 'Save appointment' : value.job_id ? 'Schedule interview' : 'Add appointment'}</button></footer></form>;
}
