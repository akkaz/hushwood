import { ApiError, fail, text, id, domain, cup, defaultCup, scoreLesson, rewards } from './model';
export interface Env { DB: D1Database; ASSETS: { fetch(request: Request): Promise<Response> }; }
type User = { id: string; email: string; name: string };
type Row = Record<string, any>;
const MAX_LESSON_MS = 4 * 3600000;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' } });
// Only deploy behind Sites Dispatch: it strips client identity headers and injects trusted ones.
export function identity(request: Request): User | null {
  const userId = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  if (!userId || !email) return null;
  let name = request.headers.get('oai-authenticated-user-full-name') || email;
  if (request.headers.get('oai-authenticated-user-full-name-encoding') === 'percent-encoded-utf-8') {
    try { name = decodeURIComponent(name); } catch { name = email; }
  }
  return { id: userId, email: email.toLowerCase(), name };
}
const stmt = (db: D1Database, query: string, ...args: unknown[]) => db.prepare(query).bind(...args);
async function rows(db: D1Database, query: string, ...args: unknown[]): Promise<Row[]> { return (await stmt(db,query,...args).all<Row>()).results; }
async function schoolFor(db: D1Database, schoolId: string, userId: string, owner = false): Promise<Row> {
  const result = await stmt(db,`SELECT s.* FROM schools s JOIN members m ON m.school_id=s.id WHERE s.id=? AND m.user_id=? ${owner ? 'AND s.owner_id=?' : ''}`,schoolId,userId,...(owner?[userId]:[])).first<Row>();
  return result ?? fail(404,'School not found or access is not permitted.');
}
async function classFor(db: D1Database, classId: string, userId: string): Promise<Row> {
  const result = await stmt(db,'SELECT c.* FROM classes c JOIN members m ON m.school_id=c.school_id WHERE c.id=? AND m.user_id=?',classId,userId).first<Row>();
  return result ?? fail(404,'Class not found or access is not permitted.');
}
function safeSchool(s: Row, userId: string) { return { id:s.id,name:s.name,domain:s.domain,cup:{...JSON.parse(s.cup),minimumMinutes:JSON.parse(s.cup).minMinutes},ownerId:s.owner_id,isOwner:s.owner_id===userId,rewards:JSON.parse(s.rewards),role:s.owner_id===userId?'owner':'teacher',...(s.owner_id===userId?{inviteCode:s.invite_code}: {}) }; }
function safeLesson(l: Row) { return { id:l.id,schoolId:l.school_id,classId:l.class_id,userId:l.user_id,status:l.status,startedAt:new Date(l.started_at).toISOString(),...(l.finished_at ? {finishedAt:new Date(l.finished_at).toISOString()}:{}),quietSeconds:l.quiet_seconds,measuredSeconds:l.measured_seconds,bestStreak:l.best_streak,xp:l.xp }; }
const safeClass = (c: Row) => ({id:c.id,schoolId:c.school_id,name:c.name,mascot:c.mascot,xp:c.xp??0,quietSeconds:c.quietSeconds??0,measuredSeconds:c.measuredSeconds??0,bestStreak:c.bestStreak??0,lessonCount:c.lessonCount??0,cupQuietSeconds:c.cupQuietSeconds??0,cupMeasuredSeconds:c.cupMeasuredSeconds??0});
const invite = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2,'0')).join('');
async function limit(db: D1Database,key: string,now: number,max=100) {
  const windowStart = Math.floor(now/600000)*600000;
  const result = await stmt(db,`INSERT INTO rate_limits(key,window_start,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=excluded.window_start,count=CASE WHEN rate_limits.window_start=excluded.window_start THEN rate_limits.count+1 ELSE 1 END RETURNING count`,key,windowStart).first<{count:number}>();
  if (!result || result.count > max) fail(429,'Too many requests. Try again in ten minutes.');
}
async function state(db: D1Database,user: User) {
  const schools = await rows(db,'SELECT s.* FROM schools s JOIN members m ON s.id=m.school_id WHERE m.user_id=? ORDER BY s.created_at',user.id);
  const classes = await rows(db,`SELECT c.*,COALESCE(SUM(l.xp),0) xp,COALESCE(SUM(l.quiet_seconds),0) quietSeconds,COALESCE(SUM(l.measured_seconds),0) measuredSeconds,COALESCE(MAX(l.best_streak),0) bestStreak,COUNT(l.id) lessonCount,
    COALESCE(SUM(CASE WHEN l.started_at >= unixepoch(json_extract(s.cup,'$.startDate'))*1000 AND l.started_at < (unixepoch(json_extract(s.cup,'$.endDate'))+86400)*1000 THEN l.quiet_seconds ELSE 0 END),0) cupQuietSeconds,
    COALESCE(SUM(CASE WHEN l.started_at >= unixepoch(json_extract(s.cup,'$.startDate'))*1000 AND l.started_at < (unixepoch(json_extract(s.cup,'$.endDate'))+86400)*1000 THEN l.measured_seconds ELSE 0 END),0) cupMeasuredSeconds
    FROM classes c JOIN members m ON m.school_id=c.school_id JOIN schools s ON s.id=c.school_id LEFT JOIN lessons l ON l.class_id=c.id AND l.status='finished' WHERE m.user_id=? GROUP BY c.id ORDER BY c.created_at`,user.id);
  const lessons = await rows(db,'SELECT l.* FROM lessons l JOIN members m ON m.school_id=l.school_id WHERE m.user_id=? ORDER BY l.started_at DESC LIMIT 100',user.id);
  return {user,storageAvailable:true,schools:schools.map(s=>safeSchool(s,user.id)),classes:classes.map(safeClass),lessons:lessons.map(safeLesson)};
}
async function bodyOf(request: Request): Promise<Row> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail(415,'Use application/json.');
  const reader = request.body?.getReader(); if (!reader) fail(400,'A JSON body is required.');
  const chunks: Uint8Array[]=[]; let length=0;
  for (;;) { const {done,value}=await reader.read(); if(done) break; length+=value.length; if(length>16384) {await reader.cancel();fail(413,'Request too large.');} chunks.push(value); }
  const bytes = new Uint8Array(length); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try { const data=JSON.parse(new TextDecoder().decode(bytes)); if(!data||typeof data!=='object'||Array.isArray(data)) fail(400,'Invalid JSON object.'); return data; } catch { return fail(400,'Invalid JSON object.'); }
}
const mascots = ['fern','ember','moss','pebble','cloud','fox','owl','deer','bunny','bear','frog'];
function mascot(value: unknown) {const result=text(value??'fern','Mascot',1,30);if(!mascots.includes(result))fail(400,'Choose a valid mascot.');return result;}
export function createWorker(now: () => number = Date.now) {
 return { async fetch(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith('/api/')) return env.ASSETS.fetch(request);
  try {
    if(!['/api/state','/api/schools','/api/classes','/api/lessons'].includes(path))fail(404,'API route not found.');
    const user=identity(request);
    if(path==='/api/state') {
      if(request.method!=='GET')fail(405,'Use GET.');
      if(!user)return json({user:null,storageAvailable:Boolean(env.DB),schools:[],classes:[],lessons:[]});
      if(!env.DB)fail(503,'School storage is unavailable.');
      return json(await state(env.DB,user));
    }
    if(request.method!=='POST')fail(405,'Use POST.');
    if(!user)fail(401,'Please sign in with ChatGPT to use school mode.');
    // JSON plus same-origin browser requests prevents cross-site writes with ambient identity.
    const origin=request.headers.get('origin');
    if(origin && origin!==new URL(request.url).origin)fail(403,'Cross-origin request rejected.');
    if(request.headers.get('sec-fetch-site')==='cross-site')fail(403,'Cross-site request rejected.');
    const body=await bodyOf(request), db=env.DB, time=now();
    if(!db)fail(503,'School storage is unavailable.');
    await limit(db,`write:${user.id}`,time);
    if(path==='/api/schools') {
      if(body.action==='create') {
        const schoolId=crypto.randomUUID(),name=text(body.name,'School name',2,100), emailDomain=domain(body.domain), code=invite();
        const settings=body.cup===undefined?defaultCup(new Date(time)):cup(body.cup);
        const rewardList=body.rewards===undefined?[{xp:100,label:'Choose a class activity'},{xp:500,label:'Outdoor learning time'}]:rewards(body.rewards);
        const result=await db.batch([
          stmt(db,'INSERT INTO schools(id,name,owner_id,domain,invite_code,cup,rewards,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM members WHERE user_id=?) < 10',schoolId,name,user.id,emailDomain,code,JSON.stringify(settings),JSON.stringify(rewardList),time,user.id),
          stmt(db,'INSERT INTO members(school_id,user_id,joined_at) SELECT id,?,? FROM schools WHERE id=?',user.id,time,schoolId),
        ]);
        if(!result[0].meta.changes)fail(409,'You can join up to ten schools.');
        return json({ok:true,school:safeSchool(await schoolFor(db,schoolId,user.id),user.id)});
      }
      if(body.action==='join') {
        await limit(db,`join:${user.id}`,time,10);
        const code=text(body.inviteCode,'Invite code',36,36).toLowerCase();
        if(!/^[0-9a-f]{36}$/.test(code))fail(400,'Invalid invite code.');
        // Authorization predicate is in INSERT, so invite rotation cannot race joining.
        await stmt(db,`INSERT OR IGNORE INTO members(school_id,user_id,joined_at) SELECT id,?,? FROM schools WHERE invite_code=? AND (domain='' OR domain=?) AND (SELECT COUNT(*) FROM members WHERE user_id=?) < 10`,user.id,time,code,user.email.split('@')[1]??'',user.id).run();
        const joined=await stmt(db,'SELECT s.* FROM schools s JOIN members m ON m.school_id=s.id WHERE s.invite_code=? AND m.user_id=?',code,user.id).first<Row>();
        if(!joined)fail(403,'Invite, email domain or school membership limit does not match.');
        return json({ok:true,school:safeSchool(joined,user.id)});
      }
      if(body.action==='update') {
        const school=await schoolFor(db,id(body.schoolId),user.id,true);
        const fields: string[]=[], values: unknown[]=[];
        const set=(field:string,value:unknown)=>{fields.push(`${field}=?`);values.push(value);};
        if(body.name!==undefined)set('name',text(body.name,'School name',2,100));
        if(body.domain!==undefined)set('domain',domain(body.domain));
        if(body.cup!==undefined)set('cup',JSON.stringify(cup(body.cup)));
        if(body.rewards!==undefined)set('rewards',JSON.stringify(rewards(body.rewards)));
        if(body.rotateInvite===true)set('invite_code',invite());
        if(fields.length)await stmt(db,`UPDATE schools SET ${fields.join(',')} WHERE id=? AND owner_id=?`,...values,school.id,user.id).run();
        if(body.removeMemberId!==undefined) {
          const removeId=text(body.removeMemberId,'Member ID',1,256);if(removeId===user.id)fail(400,'The school owner cannot be removed.');
          await db.batch([stmt(db,'DELETE FROM members WHERE school_id=? AND user_id=?',school.id,removeId),stmt(db,"UPDATE lessons SET status='expired' WHERE school_id=? AND user_id=? AND status='active'",school.id,removeId)]);
        }
        return json({ok:true,school:safeSchool(await schoolFor(db,school.id,user.id),user.id)});
      }
      fail(400,'Unknown school action.');
    }
    if(path==='/api/classes') {
      const schoolId=id(body.schoolId);await schoolFor(db,schoolId,user.id);
      if(body.action==='update') {
        const classroom=await classFor(db,id(body.classId),user.id); if(classroom.school_id!==schoolId)fail(404,'Class not found.');
        await stmt(db,'UPDATE classes SET name=?,mascot=? WHERE id=?',body.name===undefined?classroom.name:text(body.name,'Class name',1,60),body.mascot===undefined?classroom.mascot:mascot(body.mascot),classroom.id).run();
        return json({ok:true,classroom:safeClass(await classFor(db,classroom.id,user.id))});
      }
      if(body.action!==undefined && body.action!=='create')fail(400,'Unknown class action.');
      const classId=crypto.randomUUID();const result=await stmt(db,'INSERT INTO classes(id,school_id,name,mascot,created_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM classes WHERE school_id=?) < 100',classId,schoolId,text(body.name,'Class name',1,60),mascot(body.mascot),time,schoolId).run();
      if(!result.meta.changes)fail(409,'A school can contain up to 100 classes.');
      return json({ok:true,classroom:safeClass(await classFor(db,classId,user.id))});
    }
    if(body.action==='start') {
      const classroom=await classFor(db,id(body.classId),user.id), lessonId=crypto.randomUUID();
      await db.batch([
        stmt(db,"UPDATE lessons SET status='expired' WHERE status='active' AND started_at <= ? AND (user_id=? OR class_id=?)",time-MAX_LESSON_MS,user.id,classroom.id),
        stmt(db,"INSERT INTO lessons(id,school_id,class_id,user_id,status,started_at) VALUES(?,?,?,?,'active',?)",lessonId,classroom.school_id,classroom.id,user.id,time),
      ]);
      return json({ok:true,lesson:safeLesson((await stmt(db,'SELECT * FROM lessons WHERE id=?',lessonId).first<Row>())!)});
    }
    if(body.action==='cancel') {
      const lessonId=id(body.lessonId);
      const lesson=await stmt(db,'SELECT l.* FROM lessons l JOIN members m ON m.school_id=l.school_id WHERE l.id=? AND l.user_id=? AND m.user_id=?',lessonId,user.id,user.id).first<Row>();
      if(!lesson)fail(404,'Lesson not found.');
      const updated=await stmt(db,"UPDATE lessons SET status='expired' WHERE id=? AND user_id=? AND status='active' AND EXISTS (SELECT 1 FROM members WHERE school_id=lessons.school_id AND user_id=?) RETURNING *",lessonId,user.id,user.id).first<Row>();
      const current=updated??await stmt(db,'SELECT l.* FROM lessons l JOIN members m ON m.school_id=l.school_id WHERE l.id=? AND l.user_id=? AND m.user_id=?',lessonId,user.id,user.id).first<Row>();
      if(!current)fail(404,'Lesson not found.');
      return json({ok:true,lesson:safeLesson(current),alreadyClosed:!updated});
    }
    if(body.action==='finish') {
      const lesson=await stmt(db,'SELECT l.* FROM lessons l JOIN members m ON m.school_id=l.school_id WHERE l.id=? AND l.user_id=? AND m.user_id=?',id(body.lessonId),user.id,user.id).first<Row>();
      if(!lesson)fail(404,'Lesson not found.');
      if(lesson.status==='finished')return json({ok:true,lesson:safeLesson(lesson),alreadyFinished:true});
      if(lesson.status!=='active')fail(409,'This lesson has expired.');
      const score=scoreLesson(body,new Date(lesson.started_at),new Date(time));
      // Finalized lesson IS the award. Aggregates derive from it; one conditional write is atomic.
      const updated=await stmt(db,"UPDATE lessons SET status='finished',finished_at=?,quiet_seconds=?,measured_seconds=?,best_streak=?,xp=? WHERE id=? AND status='active' AND user_id=? AND EXISTS (SELECT 1 FROM members WHERE school_id=lessons.school_id AND user_id=?) RETURNING *",time,score.quietSeconds,score.measuredSeconds,score.bestStreak,score.xp,lesson.id,user.id,user.id).first<Row>();
      if(updated)return json({ok:true,lesson:safeLesson(updated),alreadyFinished:false});
      const previous=await stmt(db,"SELECT l.* FROM lessons l JOIN members m ON m.school_id=l.school_id WHERE l.id=? AND l.user_id=? AND m.user_id=? AND l.status='finished'",lesson.id,user.id,user.id).first<Row>();
      if(!previous)fail(409,'Lesson state changed. Refresh and try again.');
      return json({ok:true,lesson:safeLesson(previous),alreadyFinished:true});
    }
    fail(400,'Unknown lesson action.');
  } catch(error) {
    if(error instanceof ApiError)return json({error:error.message},error.status);
    if(error instanceof Error && /UNIQUE constraint failed: lessons\.(class_id|user_id)/.test(error.message))return json({error:'You or this class already have an active lesson. Finish it before starting another.'},409);
    console.error('Hushwood API unavailable',{type:error instanceof Error?error.name:'UnknownError'});
    return json({error:'School storage is temporarily unavailable. Please try again shortly.'},503);
  }
 } };
}
export default createWorker();
