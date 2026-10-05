import { ArrowUpRight, Check } from 'lucide-react';
import type { Data, Job, Followup } from '../../shared/models';
import { today, formatDate, days } from '../utils/dates';
import { Badge, Empty } from '../components/UI';
import type { FormKind } from '../components/Forms';
export interface Context {
  data: Data;
  openJob: (job: Job) => void;
  edit: (kind: FormKind) => void;
  save: (path: string, body: any, method?: string) => Promise<void>;
  complete: (f: Followup) => void;
}
export const tone = (stage: string) => stage === 'Rejected' ? 'red' : stage === 'Offer' ? 'green' : stage === 'Interested' ? 'gray' : 'blue';
export const dueLabel = (f: Followup) => f.due_date < today() ? 'Overdue' : f.due_date === today() ? 'Today' : formatDate(f.due_date);
export function FollowupList({
  items,
  ctx
}: {
  items: Followup[];
  ctx: Context;
}) {
  return <div className="action-list">{items.length ? items.map(f => {
      const job = ctx.data.jobs.find(j => j.id === f.job_id)!;
      const contact = ctx.data.contacts.find(c => c.id === f.contact_id);
      return <div className="action-row" key={f.id}><button className={`complete-button ${f.completed ? 'checked' : ''}`} aria-label={`Complete ${f.next_action}`} disabled={!!f.completed} onClick={() => ctx.complete(f)}><Check size={15} /></button><div className="action-content"><button className="text-button action-title" onClick={() => ctx.openJob(job)}>{f.next_action}<ArrowUpRight size={13} /></button><p><strong>{job.company}</strong><span> · {job.title}</span></p>{contact && <small>{contact.name} · {f.type}</small>}{!f.completed && <small>{f.due_date < today() ? `${days(f.due_date)} days overdue` : f.due_date === today() ? 'Due today' : `Due in ${-days(f.due_date)!} days`}</small>}{f.notes && <small>{f.notes}</small>}</div><Badge tone={f.completed ? 'gray' : f.due_date < today() ? 'red' : f.due_date === today() ? 'amber' : 'gray'}>{f.completed ? 'Completed' : dueLabel(f)}</Badge><span className="due-date">{formatDate(f.due_date)}</span></div>;
    }) : <Empty>You're all caught up. Add a follow-up to plan your next move.</Empty>}</div>;
}
export function CompanyMark({
  job
}: {
  job: Job;
}) {
  return <span className={`company-mark mark-${job.id % 5}`}>{job.company.slice(0, 1)}</span>;
}
