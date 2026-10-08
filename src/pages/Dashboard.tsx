import { ArrowRight, Plus, Briefcase, Send, CalendarClock, TriangleAlert, Trophy, UserRound, XCircle, ChevronRight } from 'lucide-react';
import { InterviewList } from '../components/InterviewList';
import { interviewDate, localTimezone, sortedInterviews } from '../utils/interviews';
import { state } from '../../shared/models';
import { today, addDays } from '../utils/dates';
import { type Context, FollowupList } from './shared';
export function Dashboard({
  ctx,
  filter,
  calendar
}: {
  ctx: Context;
  calendar: () => void;
  filter: (stage: string) => void;
}) {
  const {
    jobs,
    followups
  } = ctx.data;
  const scheduled = sortedInterviews(ctx.data.interviews.filter(i => i.status === 'Scheduled'));
  const todays = scheduled.filter(i => interviewDate(i) === today());
  const upcoming = scheduled.filter(i => interviewDate(i) > today());
  const pending = followups.filter(f => !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const weekStart = addDays(today(), -((new Date().getDay() + 6) % 7));
  const metrics = [{
    label: 'Active applications',
    value: jobs.filter(j => state(j.stage) === 'Active' && j.applied_date).length,
    icon: Briefcase,
    note: 'In your current pipeline'
  }, {
    label: 'Applied this week',
    value: jobs.filter(j => j.applied_date >= weekStart && j.applied_date <= today()).length,
    icon: Send,
    note: 'Monday through today'
  }, {
    label: 'Interviews in progress',
    value: jobs.filter(j => ['Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview'].includes(j.stage)).length,
    icon: UserRound,
    note: 'Conversations underway'
  }, {
    label: 'Follow-ups due',
    value: pending.filter(f => f.due_date <= today()).length,
    icon: CalendarClock,
    note: 'Due today or earlier'
  }, {
    label: 'Overdue follow-ups',
    value: pending.filter(f => f.due_date < today()).length,
    icon: TriangleAlert,
    note: 'Ready for your attention',
    alert: true
  }, {
    label: 'Offers',
    value: jobs.filter(j => j.stage === 'Offer').length,
    icon: Trophy,
    note: 'Opportunities with an offer'
  }, {
    label: 'Rejections',
    value: jobs.filter(j => j.stage === 'Rejected').length,
    icon: XCircle,
    note: 'Applications marked rejected'
  }];
  const pipeline = ['Interested', 'Applied', 'Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview', 'Offer'];
  return <>
 <div className="metrics">{metrics.map(m => <div className={`metric ${m.alert ? 'alert' : ''}`} key={m.label}><div className="metric-top"><span>{m.label}</span><m.icon size={16} /></div><strong>{m.value}<span className="metric-dot" /></strong><small>{m.note}</small></div>)}</div>
 <section className="card dashboard-appointments"><div className="section-heading"><div><h2>Interviews & appointments</h2><p>Your next conversations · {localTimezone()}</p></div><button className="text-button" onClick={calendar}>View calendar <ArrowRight size={15}/></button></div><div className="appointment-columns"><div><div className="appointment-group-heading"><h3>Today <span className="count-pill">{todays.length}</span></h3></div><InterviewList items={todays} ctx={ctx}/></div><div><div className="appointment-group-heading"><h3>Upcoming <span className="count-pill">{upcoming.length}</span></h3><button className="text-button" onClick={() => ctx.edit({type:'interview'})}><Plus size={14}/>Add appointment</button></div><InterviewList items={upcoming.slice(0,4)} ctx={ctx}/>{upcoming.length>4 && <button className="text-button calendar-more" onClick={calendar}>View all {upcoming.length} upcoming appointments</button>}</div></div></section>
 <section className="card pipeline-card"><div className="section-heading"><div><h2>Your pipeline</h2><p>A clear view of where things stand</p></div><button className="text-button" onClick={() => filter('')}>View applications <ArrowRight size={15} /></button></div><div className="pipeline">{pipeline.map((stage, i) => <button key={stage} onClick={() => filter(stage)} className={`pipeline-step ${stage === 'Offer' ? 'offer' : ''}`}><span className="pipeline-count">{jobs.filter(j => j.stage === stage).length}</span><span>{stage === 'Technical Interview' ? 'Technical' : stage === 'Panel / Onsite' ? 'Panel' : stage === 'Final Interview' ? 'Final' : stage}</span><div className="pipeline-track" style={{
            opacity: 0.35 + i * .08
          }} /></button>)}</div>{jobs.some(j => j.stage === 'Contacted') && <button className="text-button contacted-link" onClick={() => filter('Contacted')}>{jobs.filter(j => j.stage === 'Contacted').length} contacted opportunities <ChevronRight size={13} /></button>}</section>
 <div className="dashboard-bottom"><section className="card"><div className="section-heading"><div><h2>Follow-ups & Next Actions <span className="count-pill">{pending.length}</span></h2><p>Upcoming actions, ordered by due date</p></div><button className="text-button" onClick={() => ctx.edit({
            type: 'followup'
          })}><Plus size={16} /> Add action</button></div><FollowupList items={pending.slice(0, 5)} ctx={ctx} /></section></div></>;
}
