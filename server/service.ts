import type { DB } from './db';
import type { Data, Job, Contact, Followup, Activity } from '../shared/models';
import { stages, sources, relationships } from '../shared/models';
import { addDays, today } from '../src/utils/dates';
export class ValidationError extends Error {}
const jobFields = ['company', 'title', 'url', 'location', 'work_mode', 'compensation', 'found_date', 'applied_date', 'source', 'referral', 'description', 'notes', 'fit', 'interest', 'priority', 'stage'];
const contactFields = ['job_id', 'name', 'title', 'company', 'email', 'linkedin', 'relationship', 'first_contacted', 'last_contacted', 'notes'];
const followFields = ['job_id', 'contact_id', 'due_date', 'completed', 'type', 'notes', 'next_action'];
function validate(input: Record<string, any>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ValidationError('Invalid record.');
  for (const [key, value] of Object.entries(input)) {
    if ([...jobFields,...contactFields,...followFields,'text'].includes(key) && !['fit','interest','job_id','contact_id','completed'].includes(key) && typeof value !== 'string') throw new ValidationError('Text fields must contain text.');
    if (key.endsWith('_date') || key.endsWith('_contacted')) {
      if (value) {
        const parsed = new Date(value + 'T12:00:00Z');
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new ValidationError('Please enter a valid date.');
      }
    }
    if (['url', 'linkedin'].includes(key) && value) {
      try {
        if (!['http:', 'https:'].includes(new URL(value).protocol)) throw new Error();
      } catch {
        throw new ValidationError('URLs must begin with http:// or https://.');
      }
    }
  }
  if (input.stage && !stages.includes(input.stage)) throw new ValidationError('Invalid stage.');
  if (input.source && !sources.includes(input.source)) throw new ValidationError('Invalid source.');
  if (input.relationship && !relationships.includes(input.relationship)) throw new ValidationError('Invalid relationship.');
  for (const key of ['fit', 'interest']) if (input[key] != null && (!Number.isInteger(Number(input[key])) || input[key] < 1 || input[key] > 5)) throw new ValidationError('Ratings must be from 1 to 5.');
  if (input.work_mode && !['Remote', 'Hybrid', 'On-site'].includes(input.work_mode)) throw new ValidationError('Invalid work arrangement.');
  if (input.priority && !['High', 'Medium', 'Low', ''].includes(input.priority)) throw new ValidationError('Invalid priority.');
}
export function service(db: DB) {
  const activity = (job: number, text: string, kind = 'note', stage = '', contact: number | null = null, date?: string) => db.prepare('INSERT INTO activities(job_id,text,kind,stage,contact_id,created_at) VALUES (?,?,?,?,?,?)').run(job, text, kind, stage, contact, date || new Date().toISOString());
  const get = (table: string, id: number) => {
    const row = (db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(id) as any);
    if (!row) throw new ValidationError('Record not found.');
    return row;
  };
  const insert = (table: string, fields: string[], input: any) => {
    const keys = fields.filter(k => input[k] !== undefined);
    return Number(db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(k => input[k])).lastInsertRowid);
  };
  const update = (table: string, fields: string[], id: number, input: any) => {
    const keys = fields.filter(k => input[k] !== undefined);
    if (keys.length) db.prepare(`UPDATE ${table} SET ${keys.map(k => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map(k => input[k]), id);
  };
  const follow = (input: any) => {
    validate(input);
    get('jobs', Number(input.job_id));
    if (!input.due_date) throw new ValidationError('A due date is required.');
    if (input.contact_id && get('contacts', Number(input.contact_id)).job_id !== Number(input.job_id)) throw new ValidationError('Contact belongs to a different job.');
    const id = insert('followups', followFields, input);
    activity(input.job_id, `Follow-up added: ${input.next_action || 'Check in'} (${input.due_date})`, 'followup', '', input.contact_id || null);
    return id;
  };
  return {
    data: (): Data => ({
      jobs: db.prepare('SELECT * FROM jobs ORDER BY id DESC').all() as Job[],
      contacts: db.prepare('SELECT * FROM contacts ORDER BY id DESC').all() as Contact[],
      followups: db.prepare('SELECT * FROM followups ORDER BY id DESC').all() as Followup[],
      activities: db.prepare('SELECT * FROM activities ORDER BY id DESC').all() as Activity[]
    }),
    createJob: db.transaction((input: any) => {
      validate(input);
      if (!input.company?.trim() || !input.title?.trim()) throw new ValidationError('Company and title are required.');
      if (!input.allow_duplicate && db.prepare('SELECT id FROM jobs WHERE lower(trim(company))=lower(trim(?)) AND lower(trim(title))=lower(trim(?))').get(input.company, input.title)) throw new ValidationError('Duplicate: this company and job title already exist.');
      const appliedDate = input.applied_date || (input.stage === 'Applied' ? today() : '');
      const id = insert('jobs', jobFields, {
        ...input,
        company: input.company.trim(),
        title: input.title.trim(),
        applied_date: appliedDate,
        found_date: input.found_date || today()
      });
      if (appliedDate) activity(id, 'Applied', 'stage', 'Applied', null, appliedDate + 'T12:00:00Z');
      if (!appliedDate || input.stage && input.stage !== 'Applied') activity(id, input.stage || 'Interested', 'stage', input.stage || 'Interested');
      if (appliedDate) follow({
        job_id: id,
        due_date: addDays(appliedDate, 7),
        type: 'Application',
        next_action: 'Check in on application'
      });
      return id;
    }),
    updateJob: db.transaction((id: number, input: any) => {
      validate(input);
      const old = get('jobs', id);
      if (input.company !== undefined && !input.company.trim() || input.title !== undefined && !input.title.trim()) throw new ValidationError('Company and title are required.');
      const next = {
        ...input
      };
      if (input.stage === 'Applied' && !old.applied_date && !input.applied_date) next.applied_date = today();
      update('jobs', jobFields, id, next);
      if (input.stage && input.stage !== old.stage) activity(id, `Stage changed to ${input.stage}`, 'stage', input.stage);
      if (next.applied_date && !old.applied_date) follow({
        job_id: id,
        due_date: addDays(next.applied_date, 7),
        next_action: 'Check in on application'
      });
      if (input.notes !== undefined && input.notes !== old.notes) activity(id, 'Application notes updated');
      if (input.description !== undefined && input.description !== old.description) activity(id, 'Saved job description updated');
    }),
    saveContact: db.transaction((input: any, id?: number) => {
      validate(input);
      if (!input.name?.trim()) throw new ValidationError('Contact name is required.');
      get('jobs', Number(input.job_id));
      const old = id ? get('contacts', id) : null;
      if (old && old.job_id !== Number(input.job_id)) throw new ValidationError('A contact cannot be moved to another job.');
      const next = {...input, name:input.name.trim()};
      if (!old && next.first_contacted && !next.last_contacted) next.last_contacted = next.first_contacted;
      if (id) update('contacts', contactFields, id, next);else id = insert('contacts', contactFields, next);
      activity(input.job_id, `${old ? 'Updated' : 'Added'} contact: ${input.name}`, 'contact', '', id!);
      if (next.last_contacted && next.last_contacted !== old?.last_contacted) {
        activity(input.job_id, `Outreach to ${input.name}`, 'outreach', '', id!, next.last_contacted + 'T12:00:00Z');
        follow({
          job_id: input.job_id,
          contact_id: id,
          due_date: addDays(next.last_contacted, 7),
          type: 'Outreach',
          next_action: `Follow up with ${input.name}`
        });
      }
      return id;
    }),
    addFollowup: db.transaction(follow),
    completeFollowup: db.transaction((id: number, again = false) => {
      const old = get('followups', id);
      if (old.completed) return;
      update('followups', followFields, id, {
        completed: 1
      });
      activity(old.job_id, `Completed: ${old.next_action}`, 'followup', '', old.contact_id);
      if (again) follow({
        ...old,
        due_date: addDays(today(), 7),
        completed: 0
      });
    }),
    addActivity: (input: any) => {
      get('jobs', Number(input.job_id));
      if (!input.text?.trim()) throw new ValidationError('Activity text is required.');
      if (input.contact_id && get('contacts', Number(input.contact_id)).job_id !== Number(input.job_id)) throw new ValidationError('Contact belongs to a different job.');
      return activity(input.job_id, input.text, 'note', '', input.contact_id || null);
    }
  };
}
