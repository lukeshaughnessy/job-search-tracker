import { InterviewList } from '../components/InterviewList';
import { sortedInterviews } from '../utils/interviews';
import { useState } from 'react';
import { Plus, ExternalLink, ChevronRight } from 'lucide-react';
import type { Job } from '../../shared/models';
import { stages, state } from '../../shared/models';
import { days, formatDate } from '../utils/dates';
import { Badge, Empty } from '../components/UI';
import { type Context, tone, FollowupList, CompanyMark } from './shared';
export function Detail({
  job,
  ctx,
  back
}: {
  job: Job;
  ctx: Context;
  back: () => void;
}) {
  const contacts = ctx.data.contacts.filter(c => c.job_id === job.id);
  const followups = ctx.data.followups.filter(f => f.job_id === job.id).sort((a, b) => a.completed - b.completed || a.due_date.localeCompare(b.due_date));
  const history = ctx.data.activities.filter(a => a.job_id === job.id).sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  const [notes, setNotes] = useState(job.notes);
  const [description, setDescription] = useState(job.description);
  const [saving, setSaving] = useState('');
  const saveText = async (field: string, text: string) => {
    setSaving(field);
    try {
      await ctx.save('jobs/' + job.id, {
        [field]: text
      }, 'PATCH');
    } finally {
      setSaving('');
    }
  };
  return <><button className="text-button breadcrumb" onClick={back}>Applications <ChevronRight size={14} />{job.company}</button><section className="card detail-header"><div className="detail-title"><CompanyMark job={job} /><div><h1>{job.company}</h1><p>{job.title}</p></div><button className="button secondary" onClick={() => ctx.edit({
          type: 'job',
          job
        })}>Edit application</button>{job.url && <a className="button primary" href={job.url} target="_blank" rel="noreferrer">Open job posting <ExternalLink size={15} /></a>}</div>
        <div className="job-posting-url">
          <span className="job-posting-label">Job posting URL</span>
          {job.url ? (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-posting-link">
              <ExternalLink size={16} aria-hidden="true" />
              <span>{job.url}</span>
            </a>
          ) : (
            <div className="job-posting-missing">
              <span>No job posting URL saved.</span>
              <button className="text-button" onClick={() => ctx.edit({type: 'job', job})}>Add job URL</button>
            </div>
          )}
        </div>
        <div className="detail-facts"><div><small>Status</small><Badge tone={tone(job.stage)}>{state(job.stage)}</Badge></div><div><small>Pipeline stage</small><select aria-label="Pipeline stage" value={job.stage} onChange={e => void ctx.save('jobs/' + job.id, {
            stage: e.target.value
          }, 'PATCH')}>{stages.map(s => <option key={s}>{s}</option>)}</select></div><div><small>Applied / days active</small><strong>{formatDate(job.applied_date)} · {days(job.applied_date) ?? 0} days</strong></div><div><small>Location</small><strong>{job.location || '—'}</strong><small>{job.work_mode}</small></div><div><small>Compensation</small><strong>{job.compensation || '—'}</strong></div></div><div className="detail-meta">Found {formatDate(job.found_date)} · {job.source} · {job.priority || 'No'} priority {job.referral && `· Referred by ${job.referral}`}</div></section>
 <div className="detail-grid"><div><section className="card"><div className="section-heading"><div><h2>Interviews & appointments</h2><p>Your scheduled conversations and interview notes</p></div><button className="button primary" onClick={() => ctx.edit({type: 'interview', job})}><Plus size={16} />Schedule interview</button></div><InterviewList items={sortedInterviews(ctx.data.interviews.filter(i => i.job_id === job.id))} ctx={ctx} /></section><section className="card"><div className="section-heading"><h2>Contacts <span className="count-pill">{contacts.length}</span></h2><button className="text-button" onClick={() => ctx.edit({
              type: 'contact',
              job
            })}><Plus size={15} />Add contact</button></div>{contacts.length ? contacts.map(c => <div className="contact-row" key={c.id}><span className="avatar">{c.name.split(' ').map(s => s[0]).join('')}</span><div><strong>{c.name}</strong><p>{c.title} · {c.company}</p><small>{c.relationship} · Last contacted {formatDate(c.last_contacted)}{c.last_contacted && ` (${days(c.last_contacted)} days ago)`}</small>{c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}{c.linkedin && <a target="_blank" rel="noreferrer" href={c.linkedin}>LinkedIn ↗</a>}{c.notes && <p>{c.notes}</p>}</div><button className="text-button" onClick={() => ctx.edit({
              type: 'contact',
              job,
              contact: c
            })}>Edit</button></div>) : <Empty>Add the people helping you move this opportunity forward.</Empty>}</section><section className="card"><div className="section-heading"><h2>Follow-ups</h2><button className="text-button" onClick={() => ctx.edit({
              type: 'followup',
              job
            })}><Plus size={15} />Add follow-up</button></div><FollowupList items={followups} ctx={ctx} /></section><section className="card editor-card"><div className="section-heading"><div><h2>Notes</h2><p>Interview notes, company research, and things to remember</p></div><button className="button secondary" disabled={saving === 'notes' || notes === job.notes} onClick={() => void saveText('notes', notes)}>Save notes</button></div><textarea aria-label="Application notes" rows={8} value={notes} onChange={e => setNotes(e.target.value)} /></section><section className="card editor-card"><div className="section-heading"><div><h2>Job description</h2><p>A lasting copy of the original opportunity</p></div><button className="button secondary" disabled={saving === 'description' || description === job.description} onClick={() => void saveText('description', description)}>Save description</button></div><textarea aria-label="Job description" rows={10} value={description} onChange={e => setDescription(e.target.value)} /></section></div><section className="card timeline-card"><div className="section-heading"><h2>Activity timeline</h2><button className="icon-button" aria-label="Add activity" onClick={() => ctx.edit({
            type: 'activity',
            job
          })}><Plus size={18} /></button></div><div className="timeline">{history.map(a => <div className="timeline-item" key={a.id}><span className={`timeline-dot ${a.kind === 'stage' ? 'green' : ''}`} /><small>{formatDate(a.created_at)} · {new Date(a.created_at).getFullYear()}</small><p>{a.text}</p>{a.contact_id && <small>{contacts.find(c => c.id === a.contact_id)?.name}</small>}</div>)}</div></section></div></>;
}
