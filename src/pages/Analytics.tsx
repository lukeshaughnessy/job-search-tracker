import { TrendingUp } from 'lucide-react';
import type { Job } from '../../shared/models';
import { sources } from '../../shared/models';
import { today, days, addDays, formatDate } from '../utils/dates';
import { Badge } from '../components/UI';
import { type Context } from './shared';
export function Analytics({
  ctx
}: {
  ctx: Context;
}) {
  const jobs = ctx.data.jobs.filter(j => j.applied_date);
  const n = jobs.length;
  const achieved = (j: Job, stage: string) => j.stage === stage || ctx.data.activities.some(a => a.job_id === j.id && a.stage === stage);
  const routes = ['Applied', 'Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview', 'Offer'];
  const reached = (j: Job, index: number) => routes.slice(index).some(s => achieved(j, s));
  const rate = (num: number, den = n) => den ? `${Math.round(num / den * 100)}%` : '—';
  const responded = (j: Job) => achieved(j, 'Contacted') || reached(j, 1);
  const screens = jobs.filter(j => reached(j, 1)).length;
  const interviews = jobs.filter(j => reached(j, 2)).length;
  const metrics = [['Applications submitted', String(n)], ['Response rate', rate(jobs.filter(responded).length)], ['Recruiter screen rate', rate(screens)], ['Interview rate', rate(interviews)], ['Offer rate', rate(jobs.filter(j => achieved(j, 'Offer')).length)], ['Rejection rate', rate(jobs.filter(j => j.stage === 'Rejected').length)]];
  const funnel = ([['Applied', 0], ['Recruiter Screen', 1], ['Hiring Manager', 2], ['Technical / Panel', 3], ['Final', 5], ['Offer', 6]] as const);
  const weeks = Array.from({
    length: 8
  }, (_, i) => {
    const date = addDays(today(), -((new Date().getDay() + 6) % 7) - (7 - i) * 7);
    return {
      date,
      count: jobs.filter(j => j.applied_date >= date && j.applied_date < addDays(date, 7)).length
    };
  });
  const max = Math.max(...weeks.map(w => w.count), 1);
  const transitions = routes.slice(1).map((stage, i) => {
    const values = jobs.flatMap(j => {
      const first = (s: string) => ctx.data.activities.filter(a => a.job_id === j.id && a.stage === s).sort((a, b) => a.created_at.localeCompare(b.created_at))[0]?.created_at.slice(0, 10);
      const start = first(routes[i]),
        end = first(stage);
      return start && end && end >= start ? [days(start, end)!] : [];
    });
    return {
      label: `${routes[i]} → ${stage}`,
      count: values.length,
      avg: values.length >= 2 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : null
    };
  });
  return <><div className="analytics-note"><TrendingUp size={18} /><p>Understand your momentum. Rates use submitted applications and recorded stage history.</p></div><div className="analytics-metrics">{metrics.map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="analytics-grid"><section className="card"><div className="section-heading"><div><h2>Applications per week</h2><p>Your pace over the last eight weeks</p></div><Badge tone="green">{n} submitted</Badge></div><div className="bar-chart">{weeks.map(w => <div className="bar-col" key={w.date}><strong>{w.count}</strong><div className="bar" style={{
              height: `${Math.max(w.count / max * 150, 4)}px`
            }} /><span>{formatDate(w.date)}</span></div>)}</div></section><section className="card"><div className="section-heading"><div><h2>Application funnel</h2><p>Opportunities that reached each milestone</p></div></div><div className="funnel">{funnel.map(([label, index], i) => {
            const count = jobs.filter(j => index === 0 || reached(j, index)).length;
            const previous = i ? jobs.filter(j => funnel[i - 1][1] === 0 || reached(j, funnel[i - 1][1])).length : n;
            return <div className="funnel-row" key={label}><span>{label}</span><div><i style={{
                  width: `${n ? count / n * 100 : 0}%`
                }} /><strong>{count}</strong></div><small>{rate(count, previous)}{i ? ' from prior' : ''}</small></div>;
          })}</div></section></div><section className="card"><div className="section-heading"><div><h2>Where your opportunities come from</h2><p>Compare sources by response and interview rate</p></div></div><div className="table-scroll"><table><thead><tr>{['Source', 'Applications', 'Responses', 'Response rate', 'Interviews', 'Interview rate'].map(s => <th key={s}>{s}</th>)}</tr></thead><tbody>{sources.filter(s => jobs.some(j => j.source === s)).sort((a, b) => {
              const r = (s: string) => jobs.filter(j => j.source === s && responded(j)).length / jobs.filter(j => j.source === s).length;
              return r(b) - r(a);
            }).map(s => {
              const group = jobs.filter(j => j.source === s),
                responses = group.filter(responded).length,
                int = group.filter(j => reached(j, 2)).length;
              return <tr key={s}><td><strong>{s}</strong></td><td>{group.length}</td><td>{responses}</td><td><Badge tone="green">{rate(responses, group.length)}</Badge></td><td>{int}</td><td>{rate(int, group.length)}</td></tr>;
            })}</tbody></table></div></section><section className="card"><div className="section-heading"><div><h2>Average time between stages</h2><p>Shown when at least two applications have both stage dates</p></div></div><div className="stage-times">{transitions.map(t => <div key={t.label}><small>{t.label}</small><strong>{t.avg ? `${t.avg} days` : 'Not enough data'}</strong><span>{t.count} observed transitions</span></div>)}</div></section></>;
}
