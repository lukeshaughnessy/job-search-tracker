import { CalendarClock, ExternalLink, MapPin } from 'lucide-react';
import type { Interview } from '../../shared/models';
import type { Context } from '../pages/shared';
import { Badge, Empty } from './UI';
import { interviewTime, interviewDate } from '../utils/interviews';
import { formatDate, today } from '../utils/dates';
export function InterviewList({ items, ctx }: { items: Interview[]; ctx: Context }) {
  return <div className="interview-list">{items.length ? items.map(i => {
    const job = ctx.data.jobs.find(j => j.id === i.job_id);
    const contact = ctx.data.contacts.find(c => c.id === i.contact_id);
    return <article className={`interview-row ${i.status !== 'Scheduled' ? 'interview-inactive' : ''}`} key={i.id}>
      <div className="interview-when"><CalendarClock size={17} /><strong>{interviewDate(i) === today() ? 'Today' : formatDate(interviewDate(i))}</strong><span>{interviewTime(i)}</span><small>{i.duration_minutes} min</small></div>
      <div className="interview-info"><button className="text-button action-title" onClick={() => job ? ctx.openJob(job) : ctx.edit({type:'interview',interview:i})}>{job ? `${job.company} · ${i.stage}` : i.title || 'Appointment'}</button>{job && <p>{job.title}</p>}<small>{i.format}{(i.contact_name || contact?.name) && ` · ${i.contact_name || contact?.name}`}{contact?.title && ` · ${contact.title}`}</small>
        {(i.contact_email || contact?.email) && <a href={`mailto:${i.contact_email || contact?.email}`}>{i.contact_email || contact?.email}</a>}{i.contact_phone && <small>{i.contact_phone}</small>}
        {i.location && <small><MapPin size={12} /> {i.location}</small>}{i.preparation && <p className="interview-note"><strong>Prepare:</strong> {i.preparation}</p>}{i.notes && <p className="interview-note">{i.notes}</p>}
        {i.meeting_url && <a className="text-button interview-join" href={i.meeting_url} target="_blank" rel="noopener noreferrer">Open meeting <ExternalLink size={13} /></a>}
      </div><div className="interview-controls"><Badge tone={i.status === 'Scheduled' ? 'blue' : 'gray'}>{i.status}</Badge><button className="text-button" onClick={() => ctx.edit({type:'interview',job,interview:i})}>Edit</button>{i.status === 'Scheduled' && <button className="text-button" onClick={() => void ctx.save('interviews/'+i.id,{status:'Completed'},'PATCH')}>Mark complete</button>}</div>
    </article>;
  }) : <Empty>No appointments scheduled. Add an appointment to plan your next conversation.</Empty>}</div>;
}
