# Astra implementation review

Audit note: this is an evidence-based implementation review against the brief and plan, not an absolute guarantee. The orchestrator decides which improvements to implement. No application files were edited by the reviewer.

## Round 1 — 11 November 2026

Reviewer: `gpt-6-astra`, requested high effort; effective session metadata: medium (inherited full-context fork). Scope: Worker, database/schema/migrations, game and React integration, tests, build/history/teaser scripts and delivery documents. Two review/fix rounds maximum; shared review/fix budget is 45 minutes from dispatch. This first inspection took approximately eight minutes. Frontend CSS was still being finalized and was not assessed as a missing deliverable.

Plan fingerprint: `644cd5f9f59dcb48f7ef790fe5e0914fbd6cd714ab410508c4a731d8585dbf02`.

Implementation: new, entirely untracked worktree at review time, with no HEAD commit. SHA-256 of sorted relative paths plus contents under `worker/`, `db/`, `drizzle/`, `src/`, `tests/` and `scripts/`: `4cdd0e5c3d67ddb846f7bc72d560bb3a08500a2750b420109269a85b61bfd1b7` (17 files). The frontend was changing concurrently; this identifies the inspected snapshot, not a publication version.

**Verdict: fix before merge/publication.** Three code corrections are required; deployed verification remains a separate acceptance gate.

### Code blockers

- **R1 — Inconsistent XP and stale evolution baseline.** `src/game.ts:10` computes 70 XP for 60 quiet seconds with a 60-second streak; `worker/model.ts:51` stores 16. `src/App.tsx:40` ignores the server score and reports the client amount as saved. Reproduction with the actual functions returned `{ "ui": 70, "server": 16 }`. Use one scoring formula and the saved result for the final summary. Also refresh the class XP baseline before “Play again”: it currently passes the original `sessionClass` object despite a refreshed dashboard, so repeated lessons can show a regressed growth stage. Verify parity at boundaries and across two consecutive saved sessions.
- **R2 — Ordinary long sessions become impossible to save.** The frame loop increments counters without a limit, but `worker/model.ts:50` rejects measured duration above 7,200 seconds. A 7,201-second lesson was reproduced as a validation failure. Separately, more than four elapsed hours (including pauses) makes even the zero-point pending-session close fail at line 46. The frontend then offers a retry that cannot succeed. Implement a coherent duration limit and automatic stop, distinguish permanent expiry from temporary network failure, and allow an owned pending session to be cancelled without points at any age. Verify the measured-duration boundary, elapsed expiry, retry idempotence and cancellation ownership.
- **R3 — Embedded Sites authentication navigation.** Sign-in and sign-out anchors in `src/App.tsx:51-52` lack `target="_top"`. The Sites identity contract explicitly requires top-level navigation. Add the target to both links and verify the hosted sign-in/return flow in the supported browser surface.

The orchestrator accepted R1–R3 during this round and assigned corrections. This report records the original findings; acceptance awaits the targeted second review.

### Plan compliance observed

- Public simulated preview and real anonymous microphone game are separate; anonymous sessions do not issue lesson writes.
- Sites identity is separate from school membership. Invites are randomly generated, optional domains are filters rather than verification claims, and invite codes are omitted from teacher responses.
- The finished lesson is the XP award. The conditional update and derived aggregates avoid duplicate awards; concurrent finish tests pass.
- Tenant checks, owner-only configuration, membership removal invalidating active lessons, bounded request bodies, input validation and rate limits are implemented.
- Audio is processed locally. Pause, hidden-tab and offline handlers stop tracks; there are six translation columns and original configurable creature presets.
- Schema and generated migration are included, and the build emits the required Worker module and hosting metadata.

### Verification performed and outstanding

Executed `npm test`: **16 tests passed** across backend and game suites. Read the schema/migration, API authorization, scoring paths, frontend integration, build script and delivery disclosures. Ran direct XP-parity and 7,201-second validation reproductions.

No browser rendering, permission flow, hosted authentication, hosted D1 operation or public deployment was verified in this round. The orchestrator reported native Chrome inventory unavailable because the browser host cannot be reached. This is missing live acceptance evidence, not evidence of a code failure. The brief explicitly requires deployed Chrome testing; unit tests do not replace it.

Publication URL, public source commit, completed teaser artefact and final readable full build history also need delivery-time verification. The dialogue script explicitly exports a partial companion rather than full history; the submission correctly remains a draft until the complete history is available. Do not claim competition readiness from the companion alone.

### Optional improvements for the orchestrator

- **O1 — Teacher membership management:** expose a member list and removal control. The removal API exists, but state/UI do not expose a usable colleague-management workflow. Useful for a real school; not a blocker in the original brief.
- **O2 — Teaser response type:** add `.mp4: video/mp4` in `scripts/build-worker.mjs`. The current fallback serves video as `application/octet-stream`; verify the published media response and download/playback.
- **O3 — Clearer recovery and limits:** show the session-duration limit and a discard/close action for unrecoverable sessions. Explain the difference between retryable saving and an expired session. This complements the R2 fix.
- **O4 — Matching cup form constraints:** align UI limits with backend validation (prize length 180, qualifying minutes 600) and require a prize if the server requires one. This avoids avoidable form rejection.

### Next review scope

Verify R1–R3 corrections, their focused regression tests and the resulting build. Review only the touched integration paths and genuinely new material evidence. Keep missing deployed/browser/history evidence separate from code acceptance, and preserve the same two-round budget.

## Round 2 — targeted correction verification

Plan fingerprint unchanged: `644cd5f9f59dcb48f7ef790fe5e0914fbd6cd714ab410508c4a731d8585dbf02`. Implementation content fingerprint, using the same method and directories as round 1: `7556e0c96108434faade22398807e204a3072b150255e4313d1d632b023fbbc7` (18 files). Worktree still had no committed release version. This targeted round took approximately three minutes; the review loop ends here within the shared two-round allowance.

**Code disposition: implementation accepted, with non-blocking follow-ups.** No unresolved code blocker remains among R1–R3. This accepts the inspected code for deployment/integration verification; it does not certify the missing deployed/browser checks or overall competition readiness.

- **R1 resolved.** Frontend uses the same XP formula as the backend. The finish handler uses `result.lesson.xp`, and the next start resolves the class by ID from refreshed state. The scoring-contract suite verifies parity across ten boundaries, including 5-second and 30-second thresholds and the long-session boundary. The formulas remain separately implemented, but the contract tests protect their equivalence.
- **R2 resolved.** `sessionTiming` requests automatic finish at 7,198 measured seconds or 3.9 elapsed hours; the 500 ms monitor stops scoring before the normal server caps. Four-hour expiry selects an explicit cancellation route. Pending-history closure now uses `cancel`, which works regardless of age, requires the lesson owner and current membership, updates only active lessons and preserves completed awards. Tests cover cancellation at five hours, other-member rejection, repeat cancellation, lock release and preservation of finished XP. Suspension beyond the expiry is explicitly recoverable by cancelling without new points; it is not presented as a successful save.
- **R3 resolved in code.** Both platform authentication links now include `target="_top"` and retain same-origin relative return paths. Actual hosted authentication still requires live verification.
- **O2 addressed.** The orchestrator reports and has verified `video/mp4` on the local HTTP response. No additional browser playback claim is made.

Reviewer reran `npm test`: **32 tests passed, three suites**, at 11:29 CET. The orchestrator additionally reported a successful full build, local Wrangler migrations and real local D1 create/start/finish/idempotent flows. These are distinct from production Sites identity and hosted D1 verification.

O1 (member-management UI) and O4 (matching form constraints) remain non-blocking improvements. The live deployed Chrome requirement, hosted sign-in/persistence, public source version and final complete history remain delivery acceptance evidence to collect. The unavailable browser host is still an external verification limitation; this review does not waive the user's Chrome requirement.

Model metadata verification: the parent and full-context agents recorded `gpt-6-astra` with medium effort. The requested high-effort override was not effective on full-context forks. This is an independent-agent Astra review, not a cross-model review.
