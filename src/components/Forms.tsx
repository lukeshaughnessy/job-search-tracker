import { useState } from 'react';
import type { Data, Job, Contact } from '../../shared/models';
import { stages, sources, relationships } from '../../shared/models';
import { today, addDays } from '../utils/dates';
import { Field } from './UI';
export type FormKind = {
  type: 'job';
  job?: Job;
} | {
  type: 'contact';
  job?: Job;
  contact?: Contact;
} | {
  type: 'followup';
  job?: Job;
} | {
  type: 'activity';
  job: Job;
} | {
  type: 'note';
  job: Job;
};
export function Editor({
  kind,
  data,
  save,
  close
}: {
  kind: FormKind;
  data: Data;
  save: (path: string, body: any, method?: string) => Promise<void>;
  close: () => void;
}) {
  const initial = kind.type === 'job' ? kind.job || {
    company: '',
    title: '',
    url: '',
    location: '',
    work_mode: 'Remote',
    compensation: '',
    found_date: today(),
    applied_date: '',
    source: 'LinkedIn',
    referral: '',
    description: '',
    notes: '',
    fit: 4,
    interest: 4,
    priority: 'Medium',
    stage: 'Interested'
  } : kind.type === 'contact' ? kind.contact || {
    job_id: kind.job?.id || data.jobs[0]?.id,
    name: '',
    title: '',
    company: kind.job?.company || '',
    email: '',
    linkedin: '',
    relationship: 'Recruiter',
    first_contacted: '',
    last_contacted: '',
    notes: ''
  } : kind.type === 'followup' ? {
    job_id: kind.job?.id || data.jobs[0]?.id,
    contact_id: null,
    due_date: addDays(today(), 7),
    type: 'Outreach',
    next_action: 'Follow up on next steps',
    notes: ''
  } : kind.type === 'note' ? {
    notes: kind.job.notes
  } : {
    text: '',
    contact_id: null
  };
  const [value, setValue] = useState<any>(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = (key: string, label: string, type = 'text', wide = false, required = false) => <Field label={label} wide={wide}><input autoFocus={key === 'company' || key === 'name' || key === 'next_action' || key === 'text'} type={type} required={required} value={value[key] ?? ''} onChange={e => setValue({
      ...value,
      [key]: type === 'number' ? Number(e.target.value) : e.target.value
    })} /></Field>;
  const select = (key: string, label: string, options: string[], wide = false) => <Field label={label} wide={wide}><select value={value[key] ?? ''} onChange={e => setValue({
      ...value,
      [key]: ['fit', 'interest'].includes(key) ? Number(e.target.value) : e.target.value
    })}>{options.map(o => <option key={o} value={o}>{o || 'None'}</option>)}</select></Field>;
  const area = (key: string, label: string) => <Field label={label} wide><textarea autoFocus={kind.type === 'note'} rows={key === 'description' ? 6 : 4} value={value[key] ?? ''} onChange={e => setValue({
      ...value,
      [key]: e.target.value
    })} /></Field>;
  return <form onSubmit={async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (kind.type === 'job') await save('jobs' + (kind.job ? '/' + kind.job.id : ''), value, kind.job ? 'PATCH' : 'POST');
      if (kind.type === 'contact') await save('contacts' + (kind.contact ? '/' + kind.contact.id : ''), {
        ...value,
        job_id: Number(value.job_id)
      }, kind.contact ? 'PATCH' : 'POST');
      if (kind.type === 'followup') await save('followups', {
        ...value,
        job_id: Number(value.job_id),
        contact_id: value.contact_id ? Number(value.contact_id) : null
      });
      if (kind.type === 'note') await save('jobs/' + kind.job.id, value, 'PATCH');
      if (kind.type === 'activity') await save('activities', {
        ...value,
        job_id: kind.job.id
      });
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }}>
 <div className="form-grid">
 {kind.type === 'job' && <>{input('company', 'Company', 'text', false, true)}{input('title', 'Job title', 'text', false, true)}{input('url', 'Job posting URL', 'url', true)}{input('location', 'Location')}{select('work_mode', 'Work arrangement', ['Remote', 'Hybrid', 'On-site'])}{input('compensation', 'Compensation range')}{select('stage', 'Pipeline stage', [...stages])}{input('found_date', 'Date found', 'date')}{input('applied_date', 'Date applied', 'date')}{select('source', 'Source', sources)}{input('referral', 'Referral / contact source')}{select('fit', 'Fit rating', ['1', '2', '3', '4', '5'])}{select('interest', 'Interest rating', ['1', '2', '3', '4', '5'])}{select('priority', 'Priority', ['', 'High', 'Medium', 'Low'])}{area('notes', 'Notes')}{area('description', 'Job description')}<p className="form-hint wide">An application date automatically adds a follow-up 7 days later.</p></>}
 {(kind.type === 'contact' || kind.type === 'followup') && <Field label="Associated opportunity" wide><select required value={value.job_id} onChange={e => setValue({
          ...value,
          job_id: Number(e.target.value),
          contact_id: null,
          company: data.jobs.find(j => j.id === Number(e.target.value))?.company || ''
        })} disabled={kind.type === 'contact' && !!kind.contact}>{data.jobs.map(j => <option key={j.id} value={j.id}>{j.company} · {j.title}</option>)}</select></Field>}
 {kind.type === 'contact' && <>{input('name', 'Name', 'text', false, true)}{input('title', 'Title')}{input('company', 'Company')}{select('relationship', 'Relationship', relationships)}{input('email', 'Email', 'email')}{input('linkedin', 'LinkedIn URL', 'url')}{input('first_contacted', 'First contacted', 'date')}{input('last_contacted', 'Last contacted', 'date')}{area('notes', 'Notes')}<p className="form-hint wide">Recording new outreach adds a follow-up 7 days after the last contacted date.</p></>}
 {kind.type === 'followup' && <><Field label="Contact"><select value={value.contact_id || ''} onChange={e => setValue({
            ...value,
            contact_id: e.target.value
          })}><option value="">No specific contact</option>{data.contacts.filter(c => c.job_id === Number(value.job_id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>{input('due_date', 'Due date', 'date', false, true)}{input('next_action', 'Next action', 'text', true, true)}{select('type', 'Follow-up type', ['Application', 'Outreach', 'Interview', 'Thank you', 'Other'])}{area('notes', 'Notes')}</>}
 {kind.type === 'activity' && <>{input('text', 'What happened?', 'text', true, true)}<Field label="Contact" wide><select value={value.contact_id || ''} onChange={e => setValue({
            ...value,
            contact_id: e.target.value ? Number(e.target.value) : null
          })}><option value="">No specific contact</option>{data.contacts.filter(c => c.job_id === kind.job.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field></>}
 {kind.type === 'note' && area('notes', 'Research & interview notes')}
 </div>{error && <div className="form-error" role="alert">{error}{error.startsWith('Duplicate:') && <label className="duplicate"><input type="checkbox" onChange={e => setValue({
          ...value,
          allow_duplicate: e.target.checked
        })} />This is a separate opportunity; allow duplicate</label>}</div>}
 <footer className="form-footer"><button type="button" className="button secondary" onClick={close}>Cancel</button><button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save ' + (kind.type === 'job' ? 'application' : kind.type === 'activity' ? 'activity' : kind.type === 'note' ? 'notes' : kind.type)}</button></footer></form>;
}
