# Delivery evidence — 11 November 2026

- Canonical app: https://hushwood.akkaz.chatgpt.site
- Public source: https://github.com/akkaz/hushwood
- Teaser: https://hushwood.akkaz.chatgpt.site/media/hushwood-teaser.mp4 (20 seconds, English, 540×960, H.264, 280 KB)
- Friendly entry hostname: https://hushwood.akkaz.dev (Vercel entry redirects to Sites; Sites hosts app, identity and DB).

## Verified

1. Sites public audience; deployment returned `succeeded` for source `07b162d74de839f4492b6c15175ac9ca041d9b23` and version 1. Later documentation-only version updates may follow; Git history records them.
2. D1 managed `DB` binding with `schools`, `members`, `classes`, `lessons`, `rate_limits` confirmed by native overview. Schema migration completed at deployment.
3. Production HTTP: app, privacy, video return 200; video MIME is `video/mp4`; anonymous state returns `user:null` and empty collections; anonymous school write returns 401; invented client identity headers do not authenticate. Native sign-in route redirects to OpenAI OAuth.
4. Local Wrangler runtime with real D1 emulator: school creation, class creation, lesson start/finish, duplicate finish, persistent readback and anonymous exclusion succeeded using synthetic local identity.
5. 32 tests across three suites pass: tenant isolation, owner controls, invitations, cancellation, concurrency/idempotence, score parity, elapsed limits and frontend timing.
6. TypeScript and production build pass. No production dependency vulnerabilities reported by npm audit.
7. Astra plan audit plus two implementation-review rounds: code corrections accepted. Six locales and UI code completed. Impeccable detector run; design tokens documented.
8. Teaser checked by ffprobe, complete decoding and visual contact-sheet inspection.

## Still unverified / required before calling the submission complete

- Chrome rendered desktop/mobile and interaction checks, actual microphone permission/calibration/pause, and hosted sign-in → school/class → persistent lesson reload. The CUA browser access host returned unavailable on three attempts. HTTP/unit checks do not replace these.
- Full final client conversation export/share. `docs/history/dialogue.md` preserves user-visible dialogue from all located project parent and child sessions as a companion; tool internals and injected private context are deliberately excluded and disclosed. Original sessions remain in the local Codex archive. Export/share after the final turn to meet the event's full-history rule.

No Discord message or social post was sent. The submission draft is `docs/SUBMISSION.md`. Three separate parent build requests were found, including repeated/unsuccessful attempts; do not advertise this as one prompt. Automatic subagents and tool calls are disclosed separately.

Friendly domain verified after the final redirect deployment: HTTP 307 to the canonical Sites URL for `/`, `/?view=school` and `/media/hushwood-teaser.mp4`, preserving path/query. No authentication wall on the entry hostname.

Cleanup: local Wrangler preview stopped; local emulator/test data and temporary entry build directory removed. Worker agents used no worktrees or terminal sessions; their temporary rendering files were removed. Canonical source, original Codex sessions, generated teaser and deployment evidence retained. Unused pending Sites domain registration and the three non-authoritative Vercel DNS test records were removed. Existing DNS records/nameservers were untouched.
