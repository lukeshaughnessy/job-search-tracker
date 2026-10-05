import { useState } from 'react';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import type { Contact } from '../../shared/models';
import { today, days, formatDate } from '../utils/dates';
import { Badge, Empty } from '../components/UI';
import { type Context, dueLabel, FollowupList } from './shared';
export function Contacts({
  ctx
}: {
  ctx: Context;
}) {
  const [query, setQuery] = useState('');
  const [selectedRecord, setSelected] = useState<Contact | null>(null);
  const selected = ctx.data.contacts.find(c => c.id === selectedRecord?.id) || null;
  const filtered = ctx.data.contacts.filter(c => [c.name, c.company, c.title, c.email, c.notes].join(' ').toLowerCase().includes(query.toLowerCase()));
  const related = selected ? ctx.data.contacts.filter(c => c.id === selected.id || !!selected.email && c.email.toLowerCase() === selected.email.toLowerCase()) : [];
  const ids = related.map(c => c.id);
  const jobs = ctx.data.jobs.filter(j => related.some(c => c.job_id === j.id));
  return <><section className="card"><div className="table-toolbar"><div className="search-input"><Search size={17} /><input placeholder="Search your network…" value={query} onChange={e => setQuery(e.target.value)} /></div><button className="button secondary" disabled={!ctx.data.jobs.length} onClick={() => ctx.edit({
          type: 'contact'
        })}><Plus size={16} />Add contact</button></div><div className="table-scroll"><table><thead><tr>{['Name', 'Title / Company', 'Email', 'LinkedIn', 'Relationship', 'Associated jobs', 'Last contacted', 'Next follow-up'].map(s => <th key={s}>{s}</th>)}</tr></thead><tbody>{filtered.map(c => {
              const linked = ctx.data.contacts.filter(p => p.id === c.id || !!c.email && p.email.toLowerCase() === c.email.toLowerCase());
              const next = ctx.data.followups.filter(f => linked.some(p => p.id === f.contact_id) && !f.completed).sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
              return <tr key={c.id} onClick={() => setSelected(c)}><td><button className="text-button"><span className="avatar">{c.name.split(' ').map(s => s[0]).join('')}</span><strong>{c.name}</strong></button></td><td>{c.title}<small>{c.company}</small></td><td><a onClick={e => e.stopPropagation()} href={`mailto:${c.email}`}>{c.email || '—'}</a></td><td>{c.linkedin ? <a onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" href={c.linkedin}>Profile ↗</a> : '—'}</td><td><Badge tone="gray">{c.relationship}</Badge></td><td>{ctx.data.jobs.filter(j => linked.some(p => p.job_id === j.id)).map(j => j.company).join(', ')}</td><td>{formatDate(c.last_contacted)}<small>{c.last_contacted ? `${days(c.last_contacted)} days ago` : ''}</small></td><td>{next ? <Badge tone={next.due_date < today() ? 'red' : 'gray'}>{dueLabel(next)}</Badge> : '—'}</td></tr>;
            })}</tbody></table></div>{!filtered.length && <Empty>No contacts found.</Empty>}</section>{selected && <section className="card contact-detail"><div className="section-heading"><div><h2>{selected.name}</h2><p>{selected.title} · {selected.company}</p></div><button className="text-button" onClick={() => setSelected(null)}>Close</button></div><div className="contact-jobs">{jobs.map(j => <button key={j.id} className="button secondary" onClick={() => ctx.openJob(j)}>{j.company} · {j.title}<ArrowUpRight size={14} /></button>)}</div><div className="section-heading"><h2>Interactions</h2><button className="text-button" onClick={() => ctx.edit({
          type: 'contact',
          contact: selected
        })}>Edit contact</button></div>{ctx.data.activities.filter(a => a.contact_id && ids.includes(a.contact_id)).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(a => <div className="interaction" key={a.id}><span>{formatDate(a.created_at)}</span><p>{a.text}</p></div>)}<FollowupList items={ctx.data.followups.filter(f => f.contact_id && ids.includes(f.contact_id))} ctx={ctx} /></section>}</>;
}
