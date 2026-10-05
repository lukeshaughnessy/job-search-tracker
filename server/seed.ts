import type { DB } from './db';
import { service } from './service';
import { today, addDays } from '../src/utils/dates';
export function seed(db: DB) {
  if (db.prepare('SELECT id FROM jobs LIMIT 1').get()) return;
  const s = service(db);
  const examples = [['Meridian', 'Senior Engineering Manager — Platform Engineering', 'Hiring Manager', 'Referral', 'San Francisco, CA', 5, 5, -18, '$220k – $280k', 'Maya Chen'], ['Northstar', 'Director of Platform Engineering', 'Technical Interview', 'Recruiter', 'Denver, CO', 5, 5, -25, '$250k – $320k', 'Alex Rivera'], ['Parallel', 'Engineering Manager — Infrastructure', 'Recruiter Screen', 'LinkedIn', 'Remote, US', 4, 5, -10, '$190k – $240k', 'Jordan Lee'], ['Orbit', 'Engineering Manager — SRE', 'Applied', 'Company website', 'Seattle, WA', 4, 4, -5, '$200k – $260k', 'Sam Patel'], ['Forma', 'Senior Engineering Manager — Developer Experience', 'Interested', 'Networking', 'New York, NY', 5, 4, 0, '$210k – $275k', 'Taylor Brooks'], ['Relay', 'Director of Engineering', 'Offer', 'Referral', 'Remote, US', 5, 5, -40, '$260k – $340k', 'Morgan Ellis'], ['Cedar', 'Engineering Manager — Cloud Infrastructure', 'Rejected', 'LinkedIn', 'Austin, TX', 3, 3, -30, '$185k – $230k', 'Jamie Park'], ['Arcade', 'Engineering Manager — Reliability', 'Panel / Onsite', 'Company website', 'Boulder, CO', 4, 4, -21, '$205k – $265k', 'Casey Wu']];
  for (const [company, title, stage, source, location, fit, interest, offset, compensation, name] of examples) {
    const applied = stage === 'Interested' ? '' : addDays(today(), Number(offset));
    const id = s.createJob({
      company,
      title,
      stage: 'Interested',
      source,
      location,
      fit,
      interest,
      compensation,
      work_mode: company === 'Northstar' || company === 'Arcade' ? 'Hybrid' : 'Remote',
      priority: Number(fit) === 5 ? 'High' : 'Medium',
      found_date: addDays(today(), Number(offset) - 3),
      applied_date: applied,
      url: 'https://example.com/careers',
      notes: 'Demo opportunity. Strong focus on engineering leadership, platform strategy, and growing effective teams.',
      description: 'Lead a team of experienced engineers building reliable infrastructure and developer platforms. Partner with product and engineering leaders to define a multi-year technical strategy. Coach managers and senior engineers, improve operational excellence, and build an inclusive culture. Experience leading distributed teams and delivering complex infrastructure programs is essential.'
    });
    if (applied) {
      db.prepare('UPDATE followups SET completed=1 WHERE job_id=?').run(id);
      const route = ['Applied', 'Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview', 'Offer'];
      const stop = route.indexOf(String(stage));
      for (let i = 0; i <= stop; i++) db.prepare("INSERT INTO activities(job_id,kind,text,stage,created_at) VALUES (?,'stage',?,?,?)").run(id, route[i], route[i], addDays(applied, i * 4) + 'T12:00:00Z');
    }
    db.prepare('UPDATE jobs SET stage=? WHERE id=?').run(stage, id);
    const contact = s.saveContact({
      job_id: id,
      name,
      title: 'Talent Partner',
      company,
      email: String(name).toLowerCase().replace(' ', '.') + '@example.com',
      linkedin: 'https://www.linkedin.com/',
      relationship: 'Recruiter',
      first_contacted: applied,
      last_contacted: applied ? addDays(today(), -9) : '',
      notes: 'Introduced through the engineering leadership community.'
    });
    db.prepare('UPDATE followups SET completed=1 WHERE job_id=?').run(id);
    if (!['Rejected', 'Offer', 'Interested'].includes(String(stage))) s.addFollowup({
      job_id: id,
      contact_id: contact,
      due_date: addDays(today(), company === 'Meridian' ? -2 : company === 'Parallel' ? 0 : company === 'Northstar' ? 2 : 4),
      type: 'Outreach',
      next_action: company === 'Meridian' ? 'Check in after hiring manager conversation' : company === 'Northstar' ? 'Prepare platform strategy interview' : 'Follow up on next steps',
      notes: ''
    });
  }
}
