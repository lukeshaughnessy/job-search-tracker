import { Clock, Plus, CalendarClock, TriangleAlert } from 'lucide-react';
import { today, addDays } from '../utils/dates';
import { Badge } from '../components/UI';
import { type Context, FollowupList } from './shared';
export function Followups({
  ctx
}: {
  ctx: Context;
}) {
  const pending = ctx.data.followups.filter(f => !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const sections = [{
    label: 'Overdue',
    icon: TriangleAlert,
    tone: 'red',
    items: pending.filter(f => f.due_date < today())
  }, {
    label: 'Today',
    icon: CalendarClock,
    tone: 'amber',
    items: pending.filter(f => f.due_date === today())
  }, {
    label: 'Next 7 Days',
    icon: Clock,
    tone: 'green',
    items: pending.filter(f => f.due_date > today() && f.due_date <= addDays(today(), 7))
  }, {
    label: 'Later',
    icon: CalendarClock,
    tone: 'gray',
    items: pending.filter(f => f.due_date > addDays(today(), 7))
  }];
  return <><div className="queue-summary"><p><strong>{pending.length} open actions.</strong> Small steps keep good conversations moving.</p><button className="button primary" onClick={() => ctx.edit({
        type: 'followup'
      })}><Plus size={16} />Add follow-up</button></div>{sections.map(s => <section className="card queue-section" key={s.label}><div className="section-heading"><h2><s.icon size={18} />{s.label}<Badge tone={s.tone}>{s.items.length}</Badge></h2></div><FollowupList items={s.items} ctx={ctx} /></section>)}<details className="card completed-section"><summary>Completed follow-ups ({ctx.data.followups.filter(f => f.completed).length})</summary><FollowupList items={ctx.data.followups.filter(f => f.completed)} ctx={ctx} /></details></>;
}
