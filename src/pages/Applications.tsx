import { useState } from 'react';
import { Search, SlidersHorizontal, MoreHorizontal } from 'lucide-react';
import type { Job } from '../../shared/models';
import { stages, sources, state } from '../../shared/models';
import { today, days, formatDate } from '../utils/dates';
import { Badge, Rating, Empty } from '../components/UI';
import type { FormKind } from '../components/Forms';
import { type Context, tone, dueLabel, CompanyMark } from './shared';
export function Applications({
  ctx,
  initialStage
}: {
  ctx: Context;
  initialStage: string;
}) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState(initialStage);
  const [active, setActive] = useState(false);
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');
  const [fit, setFit] = useState('');
  const [due, setDue] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState('applied_date');
  const [asc, setAsc] = useState(false);
  const [menu, setMenu] = useState<number | null>(null);
  const rows = ctx.data.jobs.filter(j => (!active || state(j.stage) === 'Active') && (!stage || j.stage === stage) && (!company || j.company === company) && (!location || j.location === location) && (!source || j.source === source) && (!fit || j.fit === Number(fit)) && (!from || j.applied_date >= from) && (!to || !!j.applied_date && j.applied_date <= to) && (!due || ctx.data.followups.some(f => f.job_id === j.id && !f.completed && f.due_date <= today())) && [j.company, j.title, j.notes, ...ctx.data.contacts.filter(c => c.job_id === j.id).map(c => c.name + ' ' + c.notes)].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a, b) => {
    const v = (j: Job): string | number => sort === 'days' ? days(j.applied_date) ?? -1 : sort === 'contact' ? ctx.data.contacts.find(c => c.job_id === j.id)?.name || '' : sort === 'followup' ? ctx.data.followups.filter(f => f.job_id === j.id && !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))[0]?.due_date || '' : j[(sort as keyof Job)];
    const x = v(a),
      y = v(b);
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * (asc ? 1 : -1);
  });
  const filterSelect = (value: string, set: (s: string) => void, label: string, values: string[]) => <select aria-label={label} value={value} onChange={e => set(e.target.value)}><option value="">{label}</option>{values.map(v => <option key={v}>{v}</option>)}</select>;
  const columns = [['company', 'Company'], ['title', 'Role'], ['location', 'Location'], ['applied_date', 'Applied'], ['stage', 'Stage'], ['fit', 'Fit'], ['interest', 'Interest'], ['contact', 'Primary contact'], ['followup', 'Next follow-up'], ['days', 'Days'], ['source', 'Source']];
  return <section className="card applications-card"><div className="table-toolbar"><div className="search-input"><Search size={17} /><input placeholder="Search companies, roles, contacts, notes…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className={`button secondary ${expanded ? 'selected' : ''}`} onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={16} />Filters</button><span className="muted">{rows.length} opportunities</span></div><div className="filters">{filterSelect(stage, setStage, 'All stages', [...stages])}{filterSelect(source, setSource, 'All sources', sources)}{filterSelect(fit, setFit, 'Any fit', ['1', '2', '3', '4', '5'])}<label className="check-label"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />Active only</label><label className="check-label"><input type="checkbox" checked={due} onChange={e => setDue(e.target.checked)} />Follow-up due</label>{expanded && <>{filterSelect(company, setCompany, 'All companies', [...new Set(ctx.data.jobs.map(j => j.company))])}{filterSelect(location, setLocation, 'All locations', [...new Set(ctx.data.jobs.map(j => j.location))])}<label>Applied from <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>to <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></>}<button className="text-button" onClick={() => {
        setStage('');
        setSource('');
        setFit('');
        setActive(false);
        setDue(false);
        setCompany('');
        setLocation('');
        setFrom('');
        setTo('');
        setQuery('');
      }}>Reset</button></div><div className="table-scroll"><table><thead><tr>{columns.map(([key, label]) => <th key={key}><button onClick={() => {
                setAsc(sort === key ? !asc : true);
                setSort(key);
              }}>{label}{sort === key ? asc ? ' ↑' : ' ↓' : ''}</button></th>)}<th>Actions</th></tr></thead><tbody>{rows.map(j => {
            const contact = ctx.data.contacts.filter(c => c.job_id === j.id).sort((a, b) => a.id - b.id)[0];
            const next = ctx.data.followups.filter(f => f.job_id === j.id && !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
            return <tr key={j.id} onClick={() => ctx.openJob(j)}><td><button className="company-cell text-button"><CompanyMark job={j} /><strong>{j.company}</strong></button></td><td className="role-cell">{j.title}<small>{j.priority} priority</small></td><td>{j.location}<small>{j.work_mode}</small></td><td>{formatDate(j.applied_date)}</td><td onClick={e => e.stopPropagation()}><select aria-label={`Stage for ${j.company}`} className={`stage-select ${tone(j.stage)}`} value={j.stage} onChange={e => void ctx.save('jobs/' + j.id, {
                  stage: e.target.value
                }, 'PATCH')}>{stages.map(s => <option key={s}>{s}</option>)}</select></td><td><Rating value={j.fit} /></td><td><Rating value={j.interest} /></td><td>{contact?.name || '—'}</td><td>{next ? <Badge tone={next.due_date < today() ? 'red' : next.due_date === today() ? 'amber' : 'gray'}>{dueLabel(next)}</Badge> : '—'}</td><td>{days(j.applied_date) ?? '—'}</td><td>{j.source}</td><td className="menu-cell" onClick={e => e.stopPropagation()}><button className="icon-button" aria-label={`Actions for ${j.company}`} onClick={() => setMenu(menu === j.id ? null : j.id)}><MoreHorizontal size={18} /></button>{menu === j.id && <div className="dropdown">{[['contact', 'Add contact'], ['followup', 'Add follow-up'], ['note', 'Add note']].map(([type, label]) => <button key={type} onClick={() => {
                    ctx.edit(({
                      type,
                      job: j
                    } as FormKind));
                    setMenu(null);
                  }}>{label}</button>)}<button onClick={() => {
                    void ctx.save('jobs/' + j.id, {
                      stage: 'Rejected'
                    }, 'PATCH');
                    setMenu(null);
                  }}>Mark rejected</button></div>}</td></tr>;
          })}</tbody></table></div>{!rows.length && <Empty>No matching applications. Adjust your filters or add an opportunity.</Empty>}<div className="table-footer">{rows.length} of {ctx.data.jobs.length} opportunities </div></section>;
}
