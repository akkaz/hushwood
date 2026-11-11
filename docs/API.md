# Hushwood Sites API

The Cloudflare Worker runs behind **Sites Dispatch**, with the `DB` D1 binding. Native Sites authentication injects `oai-authenticated-user-id` and `oai-authenticated-user-email`. Both are required for school operations. The optional encoded full name is display-only. Do not expose this Worker directly through an untrusted proxy that accepts client-supplied identity headers; local identity headers are test fixtures, not a login method.

Login/logout are top-level browser navigation to the Sites platform routes; no password API, local session cookie, MongoDB or Vercel API remains. Sign-in establishes identity, not school membership. An email domain is an optional organizational filter, not proof of school affiliation or verified email.

All API responses are JSON with `Cache-Control: private, no-store`. Errors are `{error:string}` with 400 validation, 401 authentication, 403 invitation/origin, 404 inaccessible resources, 409 conflict, 413 body size, 415 content type, 429 throttling or 503 storage errors. Writes require JSON, reject cross-site browser requests and explicit foreign origins, and are limited to 100/user/10 minutes (joins additionally 10/user/10 minutes). Body size is bounded to 16 KiB. No audio or student identity is stored.

## Read state

`GET /api/state` → `{user,storageAvailable,schools,classes,lessons}`.

Anonymous: `user:null` and empty arrays, even if data exists. Authenticated user: `{id,email,name}` from Sites. Only member schools, their classes and the 100 latest lessons are returned.

School: `{id,name,domain,role:'owner'|'teacher',isOwner,ownerId,cup,rewards,inviteCode?}`. The secret invite is returned only to the owner. Cup: `{name,prize,startDate,endDate,minMinutes}`, dates are `YYYY-MM-DD` in UTC. `minimumMinutes` is accepted and emitted as a frontend alias for `minMinutes`. Rewards: `[{xp,label}]`, up to twelve distinct positive XP thresholds.

Class: `{id,schoolId,name,mascot,xp,quietSeconds,measuredSeconds,bestStreak,lessonCount,cupQuietSeconds,cupMeasuredSeconds}`. These totals derive directly from finished lessons, never from mutable client totals.

Lesson: `{id,schoolId,classId,userId,status,startedAt,finishedAt?,quietSeconds,measuredSeconds,bestStreak,xp}`. Times are ISO UTC; status is `active`, `finished` or `expired`.

## Schools

`POST /api/schools`

- `{action:'create',name,domain?,cup?,rewards?}` creates school and owner membership in one D1 batch. Response `{ok:true,school}`. Maximum ten schools/user.
- `{action:'join',inviteCode}` joins via a cryptographically random 144-bit invitation and optional exact domain match. Invitation authorization is part of the membership insert, so concurrent invite rotation cannot authorize a later join with the old token.
- `{action:'update',schoolId,name?,domain?,cup?,rewards?,rotateInvite?,removeMemberId?}` is owner-only. Rotation generates a fresh invitation. Removing a member also expires their active school lessons; owner removal is disallowed.

## Classes

`POST /api/classes` with `{action:'create',schoolId,name,mascot?}` creates a class (omitting action also means create). `{action:'update',schoolId,classId,name?,mascot?}` updates a member school's class. Response `{ok:true,classroom}`. Maximum 100 classes/school. Mascots: `fern`, `ember`, `moss`, `pebble`, `cloud`, `fox`, `owl`, `deer`, `bunny`, `bear`, `frog`.

## Lessons and scoring

`POST /api/lessons`:

- `{action:'start',classId}` → `{ok:true,lesson}`. Partial unique SQL indexes guarantee at most one active lesson per class and per teacher. Abandoned sessions older than four hours expire without rewards before a new session starts.
- `{action:'cancel',lessonId}` → `{ok:true,lesson,alreadyClosed}`. The starting teacher who remains a school member can expire an active lesson at any age without XP. Retrying is idempotent; already finished lessons retain their existing award.
- `{action:'finish',lessonId,quietSeconds,measuredSeconds,bestStreak}` → `{ok:true,lesson,alreadyFinished}`. Only the starting teacher who is still a member can finish. A finalized retry returns the original result without a new award.

Finish checks server elapsed time (1 second to 4 hours), `0 ≤ bestStreak ≤ quietSeconds ≤ measuredSeconds ≤ min(serverElapsed,7200)`, finite numbers; counters are floored to whole seconds. XP is `floor(quietSeconds/5) + 2*floor(bestStreak/30)`. A single conditional `UPDATE ... WHERE status='active' RETURNING` finalizes the lesson; this immutable result is the sole award, and class totals use SQL aggregates. Concurrent duplicate finishes therefore cannot double-award. Counters remain client-reported microphone measurements: elapsed bounds deter obvious invalid submissions but are not tamper-proof evidence of quietness.

Cup totals include finished lessons whose **start** is within the configured UTC dates (inclusive end day). The UI ranks quiet/measured ratio for classes meeting `minMinutes*60` measured seconds. Changing cup dates recomputes cup totals and preserves lifetime XP. Date spans are at most 366 days; minimum minutes range 1–600. Rewards are teacher-defined classroom milestones, not cash or automatic transactions.

## Schema and verification

`db/schema.ts` is the Drizzle source; `drizzle/` contains generated schema-only SQL, snapshot and journal. Sites applies pending migrations before deploying the Worker; API requests never create schema. Applied migration history is immutable. Regenerate future changes with `npx drizzle-kit generate`.

`tests/backend.test.ts` runs real SQLite against the generated migration through a D1-compatible adapter, covering anonymous access, two-header identity, origin restrictions, invites/domain, tenant boundaries, owner-only changes, member removal, active uniqueness, elapsed/counter rejection, concurrent idempotent finishes and cup aggregation. These tests verify SQL/API behavior, not Sites authentication infrastructure; hosted QA must separately exercise platform sign-in and bound D1 storage.
