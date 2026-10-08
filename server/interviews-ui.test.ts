import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { openDatabase } from './db';
import { service } from './service';
import { Dashboard } from '../src/pages/Dashboard';
import { Calendar } from '../src/pages/Calendar';
import { Detail } from '../src/pages/Detail';
import { InterviewForm } from '../src/components/InterviewForm';
import { addDays, today } from '../src/utils/dates';
import { localAppointmentISO, localTimezone } from '../src/utils/interviews';
import type { Context } from '../src/pages/shared';
test('dashboard, calendar, application detail and scheduling form render saved interview details',()=>{
  const db=openDatabase(':memory:');const s=service(db);const job=s.createJob({company:'Interview Test Co',title:'Director of Platform'});
  for(const [stage,date,status] of [['Phone Screen',today(),'Scheduled'],['Technical Interview',addDays(today(),2),'Scheduled'],['Final Interview',today(),'Cancelled']]) s.saveInterview({job_id:job,stage,starts_at:localAppointmentISO(date,'10:30'),timezone:localTimezone(),duration_minutes:45,format:'Video',status,contact_name:'Sam Interviewer',contact_email:'sam@example.com',meeting_url:'https://example.com/meet'});
  const data=s.data();const ctx:Context={data,openJob:()=>{},edit:()=>{},save:async()=>{},complete:()=>{}};
  const dashboard=renderToStaticMarkup(createElement(Dashboard,{ctx,filter:()=>{},calendar:()=>{}}));
  assert.match(dashboard,/Today/);assert.match(dashboard,/Upcoming/);assert.match(dashboard,/Technical Interview/);assert.match(dashboard,/Sam Interviewer/);assert.doesNotMatch(dashboard,/Cancelled/);
  const calendar=renderToStaticMarkup(createElement(Calendar,{ctx}));assert.match(calendar,/Add appointment on/);assert.match(calendar,/Phone Screen/);assert.match(calendar,/10:30/);
  const detail=renderToStaticMarkup(createElement(Detail,{ctx,job:data.jobs[0],back:()=>{}}));assert.match(detail,/Schedule interview/);assert.match(detail,/Cancelled/);
  const form=renderToStaticMarkup(createElement(InterviewForm,{kind:{type:'interview',job:data.jobs[0],interview:data.interviews[0]},data,save:async()=>{},close:()=>{}}));assert.match(form,/Contact email/);assert.match(form,/sam@example.com/);assert.match(form,/Preparation/);db.close();
});

test('empty workspace supports standalone appointments and calendar starts Sunday',()=>{
  const db=openDatabase(':memory:');const s=service(db);s.saveInterview({job_id:null,title:'Coffee with a mentor',stage:'Other',starts_at:localAppointmentISO(today(),'14:00'),timezone:localTimezone(),duration_minutes:30,format:'In person',status:'Scheduled'});
  const data=s.data();const ctx:Context={data,openJob:()=>{},edit:()=>{},save:async()=>{},complete:()=>{}};
  const calendar=renderToStaticMarkup(createElement(Calendar,{ctx}));assert.match(calendar,/Coffee with a mentor/);assert.match(calendar,/Add appointment/);
  const headings=[...calendar.matchAll(/class="calendar-weekday">(.*?)<\/div>/g)].map(m=>m[1]);assert.deepEqual(headings,['Sun','Mon','Tue','Wed','Thu','Fri','Sat']);
  const firstDate=calendar.match(/Add appointment on (\d{4}-\d{2}-\d{2})/);assert.ok(firstDate);assert.equal(new Date(firstDate[1]+'T12:00:00').getDay(),0);
  const dashboard=renderToStaticMarkup(createElement(Dashboard,{ctx,filter:()=>{},calendar:()=>{}}));assert.match(dashboard,/Coffee with a mentor/);
  const form=renderToStaticMarkup(createElement(InterviewForm,{kind:{type:'interview'},data,save:async()=>{},close:()=>{}}));assert.match(form,/Appointment title/);assert.match(form,/Standalone appointment/);assert.doesNotMatch(form,/disabled=""/);db.close();
});
