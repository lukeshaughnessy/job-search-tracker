export const stages = (['Interested', 'Applied', 'Contacted', 'Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview', 'Offer', 'Rejected', 'Withdrawn'] as const);
export const sources = ['LinkedIn', 'Company website', 'Recruiter', 'Referral', 'Networking', 'Other'];
export const relationships = ['Recruiter', 'Hiring Manager', 'Referral', 'Employee', 'Executive', 'Other'];
export type Stage = typeof stages[number];
export interface Job {
  id: number;
  company: string;
  title: string;
  url: string;
  location: string;
  work_mode: string;
  compensation: string;
  found_date: string;
  applied_date: string;
  source: string;
  referral: string;
  description: string;
  notes: string;
  priority: string;
  stage: Stage;
  created_at: string;
}
export interface Contact {
  id: number;
  job_id: number;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedin: string;
  relationship: string;
  first_contacted: string;
  last_contacted: string;
  notes: string;
}
export interface Followup {
  id: number;
  job_id: number;
  contact_id: number | null;
  due_date: string;
  completed: number;
  type: string;
  notes: string;
  next_action: string;
}
export interface Activity {
  id: number;
  job_id: number;
  contact_id: number | null;
  kind: string;
  text: string;
  stage: string;
  created_at: string;
}
export const interviewStages = ['Phone Screen', 'Recruiter Screen', 'Hiring Manager', 'Technical Interview', 'Panel / Onsite', 'Final Interview', 'Other'] as const;
export interface Interview {
  id: number;
  job_id: number | null;
  title?: string;
  contact_id: number | null;
  stage: string;
  starts_at: string;
  timezone: string;
  duration_minutes: number;
  format: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  meeting_url: string;
  location: string;
  notes: string;
  preparation: string;
  created_at: string;
}
export interface Data {
  jobs: Job[];
  contacts: Contact[];
  followups: Followup[];
  activities: Activity[];
  interviews: Interview[];
}
export const state = (stage: string) => stage === 'Rejected' ? 'Rejected' : stage === 'Offer' ? 'Offer' : stage === 'Withdrawn' ? 'Closed' : 'Active';
