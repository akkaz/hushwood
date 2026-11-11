import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createWorker, type Env } from '../worker/index';
class Statement {
 constructor(public db: DatabaseSync,public sql: string,public args: any[]=[]) {}
 bind(...args: any[]) { return new Statement(this.db,this.sql,args); }
 async first() { return this.db.prepare(this.sql).get(...this.args) ?? null; }
 async all() { return { results:this.db.prepare(this.sql).all(...this.args),success:true,meta:{} }; }
 async run() { const r=this.db.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}}; }
}
class Database {
 raw=new DatabaseSync(':memory:');
 constructor() { this.raw.exec('PRAGMA foreign_keys=ON;');this.raw.exec(readFileSync(new URL('../drizzle/0000_mute_frog_thor.sql',import.meta.url),'utf8')); }
 prepare(sql:string) { return new Statement(this.raw,sql); }
 async batch(statements:Statement[]) { this.raw.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());this.raw.exec('COMMIT');return results;}catch(e){this.raw.exec('ROLLBACK');throw e;} }
}
let db:Database,env:Env,time:number,worker:ReturnType<typeof createWorker>;
const users={owner:{id:'owner',email:'owner@school.edu'},teacher:{id:'teacher',email:'teacher@school.edu'},outsider:{id:'outsider',email:'other@else.edu'}};
type Who = keyof typeof users | null;
async function call(path:string,body?:unknown,who:Who='owner',extra:Record<string,string>={}) {
 const headers:Record<string,string>={...extra};
 if(who){headers['oai-authenticated-user-id']=users[who].id;headers['oai-authenticated-user-email']=users[who].email;}
 if(body!==undefined)headers['content-type']='application/json';
 const response=await worker.fetch(new Request(`https://hushwood.example/api/${path}`,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),env);
 return {status:response.status,data:await response.json() as any};
}
async function setup() {
 const {data:{school}}=await call('schools',{action:'create',name:'Our school',domain:'school.edu'});
 const {data:{classroom}}=await call('classes',{schoolId:school.id,name:'Class A',mascot:'fern'});
 return {school,classroom};
}
beforeEach(()=>{db=new Database();env={DB:db as unknown as D1Database,ASSETS:{fetch:async()=>new Response('asset')}};time=Date.parse('2026-11-11T10:00:00Z');worker=createWorker(()=>time);});
describe('Sites identity and tenant authorization',()=>{
 it('returns empty anonymous state and rejects anonymous writes',async()=>{
  await setup();expect((await call('state',undefined,null)).data).toMatchObject({user:null,schools:[],classes:[],lessons:[]});
  expect((await call('schools',{action:'create',name:'No'},null)).status).toBe(401);
 });
 it('does not accept a lone identity header',async()=>{
  const r=await worker.fetch(new Request('https://hushwood.example/api/state',{headers:{'oai-authenticated-user-id':'owner'}}),env);expect((await r.json() as any).user).toBeNull();
 });
 it('rejects cross origin writes and unknown authentication routes',async()=>{
  expect((await call('schools',{action:'create',name:'No'},'owner',{origin:'https://evil.example'})).status).toBe(403);
  expect((await call('auth',{action:'login'})).status).toBe(404);
 });
 it('requires invite and optional domain; conceals invite from teachers',async()=>{
  const {school}=await setup();
  expect((await call('schools',{action:'join',inviteCode:'f'.repeat(36)},'teacher')).status).toBe(403);
  expect((await call('schools',{action:'join',inviteCode:school.inviteCode},'outsider')).status).toBe(403);
  const joined=await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');expect(joined.status).toBe(200);expect(joined.data.school.inviteCode).toBeUndefined();
  expect((await call('state',undefined,'teacher')).data.schools).toHaveLength(1);
 });
 it('isolates tenants and reserves configuration to owner',async()=>{
  const {school,classroom}=await setup();
  expect((await call('classes',{schoolId:school.id,name:'Attack'},'outsider')).status).toBe(404);
  expect((await call('lessons',{action:'start',classId:classroom.id},'outsider')).status).toBe(404);
  expect((await call('state',undefined,'outsider')).data.classes).toEqual([]);
  await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');
  expect((await call('schools',{action:'update',schoolId:school.id,rotateInvite:true},'teacher')).status).toBe(404);
  const changed=await call('schools',{action:'update',schoolId:school.id,rotateInvite:true,rewards:[{xp:20,label:'Reading time'}]});expect(changed.status).toBe(200);expect(changed.data.school.inviteCode).not.toBe(school.inviteCode);
  expect(changed.data.school.rewards).toEqual([{xp:20,label:'Reading time'}]);
 });
 it('removed teachers lose access and active lessons expire',async()=>{
  const {school,classroom}=await setup();await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');
  const started=await call('lessons',{action:'start',classId:classroom.id},'teacher');
  expect((await call('schools',{action:'update',schoolId:school.id,removeMemberId:'teacher'})).status).toBe(200);time+=60000;
  expect((await call('lessons',{action:'finish',lessonId:started.data.lesson.id,quietSeconds:60,measuredSeconds:60,bestStreak:60},'teacher')).status).toBe(404);
  expect((await call('lessons',{action:'start',classId:classroom.id})).status).toBe(200);
 });
});
describe('atomic scoring and bounded counters',()=>{
 it('allows only one active lesson per class and teacher, then expires abandoned sessions',async()=>{
  const {school,classroom}=await setup();await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');
  expect((await call('lessons',{action:'start',classId:classroom.id})).status).toBe(200);
  expect((await call('lessons',{action:'start',classId:classroom.id},'teacher')).status).toBe(409);
  time+=4*3600000+1;expect((await call('lessons',{action:'start',classId:classroom.id},'teacher')).status).toBe(200);
 });
 it('cancels abandoned lessons at any age without XP and retries idempotently',async()=>{
  const {school,classroom}=await setup();await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');
  const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=5*3600000;
  expect((await call('lessons',{action:'cancel',lessonId:lesson.id},'teacher')).status).toBe(404);
  const cancelled=await call('lessons',{action:'cancel',lessonId:lesson.id});expect(cancelled.status).toBe(200);expect(cancelled.data.lesson.status).toBe('expired');expect(cancelled.data.alreadyClosed).toBe(false);
  expect((await call('lessons',{action:'cancel',lessonId:lesson.id})).data.alreadyClosed).toBe(true);
  expect((await call('state')).data.classes[0]).toMatchObject({xp:0,lessonCount:0});
  expect((await call('lessons',{action:'start',classId:classroom.id})).status).toBe(200);
 });
 it('cancelling a finished lesson preserves its awarded result',async()=>{
  const {classroom}=await setup();const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=60000;
  await call('lessons',{action:'finish',lessonId:lesson.id,quietSeconds:60,measuredSeconds:60,bestStreak:60});
  const result=await call('lessons',{action:'cancel',lessonId:lesson.id});expect(result.data.alreadyClosed).toBe(true);expect(result.data.lesson).toMatchObject({status:'finished',xp:16});
  expect((await call('state')).data.classes[0].xp).toBe(16);
 });
 it('validates elapsed time, nonnegative counters and streak relationships',async()=>{
  const {classroom}=await setup();const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=10000;
  for(const counters of [{quietSeconds:11,measuredSeconds:11,bestStreak:0},{quietSeconds:9,measuredSeconds:8,bestStreak:0},{quietSeconds:2,measuredSeconds:8,bestStreak:3},{quietSeconds:-1,measuredSeconds:8,bestStreak:0},{quietSeconds:null,measuredSeconds:8,bestStreak:0}])expect((await call('lessons',{action:'finish',lessonId:lesson.id,...counters})).status).toBe(400);
  expect((await call('state')).data.classes[0].xp).toBe(0);
 });
 it('awards exactly once for parallel finishes and persists aggregates',async()=>{
  const {classroom}=await setup();const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=60000;
  const finish={action:'finish',lessonId:lesson.id,quietSeconds:60,measuredSeconds:60,bestStreak:60};
  const results=await Promise.all([call('lessons',finish),call('lessons',finish)]);expect(results.map(r=>r.status)).toEqual([200,200]);expect(results.filter(r=>r.data.alreadyFinished===false)).toHaveLength(1);
  expect((await call('state')).data.classes[0]).toMatchObject({xp:16,quietSeconds:60,measuredSeconds:60,bestStreak:60,lessonCount:1,cupQuietSeconds:60,cupMeasuredSeconds:60});
  expect((await call('lessons',{...finish,quietSeconds:999999})).data.alreadyFinished).toBe(true);
  expect((await call('state')).data.classes[0].xp).toBe(16);
 });
 it('rejects another member finishing a teachers lesson',async()=>{
  const {school,classroom}=await setup();await call('schools',{action:'join',inviteCode:school.inviteCode},'teacher');
  const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=60000;
  expect((await call('lessons',{action:'finish',lessonId:lesson.id,quietSeconds:60,measuredSeconds:60,bestStreak:60},'teacher')).status).toBe(404);
 });
 it('recomputes cup totals from the configured UTC start date without deleting lifetime XP',async()=>{
  const {school,classroom}=await setup();const {data:{lesson}}=await call('lessons',{action:'start',classId:classroom.id});time+=60000;
  await call('lessons',{action:'finish',lessonId:lesson.id,quietSeconds:60,measuredSeconds:60,bestStreak:60});
  await call('schools',{action:'update',schoolId:school.id,cup:{name:'Next',prize:'Fun',startDate:'2026-12-01',endDate:'2026-12-31',minMinutes:1}});
  expect((await call('state')).data.classes[0]).toMatchObject({xp:16,cupQuietSeconds:0,cupMeasuredSeconds:0});
 });
});
