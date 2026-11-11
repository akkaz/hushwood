# Ten Prompt Build submission

## Draft for Discord — update verified links before posting

**Hushwood — grow a quieter classroom together.**

An open-source classroom game for teachers and their students. A microphone-controlled forest companion reacts to the room, earns XP and evolves. Try it without an account; sign in to organize classes, invite colleagues and run a school cup. Audio is processed locally and never uploaded. Available in English, Italian, French, German, Spanish and Portuguese.

Demo: publication pending verification.
Source: publication pending verification.
Teaser: `public/media/hushwood-teaser.mp4`.

## How I spent my ten

1. Original project brief: build an open-source classroom microphone game, public demo, school accounts/cup, languages, deployment, teaser, Chrome verification and Astra review. Exact attachment: [original-brief.txt](history/original-brief.txt). This attempt began the Hushwood repository; it did not finish delivery.
2. Follow-up: the full brief was attached again, with: “Forse conviene pubblicare e usare il DB di chatgpt sites che ho incluso nel mio piano, valuta tu, fai la scelta secondo te piu senzata”. Exact attachment: [brief.txt](history/brief.txt). This directed the hosting/database evaluation and completion.

The machine history also contains goal-control pause/automatic continuation messages and injected AGENTS.md instructions. These are disclosed, not silently counted as new feature prompts or hidden. The organizer decides how goal controls are counted under the rules. The submission must not advertise a one-prompt build. Built-in subagent work and automatic tool use are retained in the original session history.

## Build notes

- Client: Codex, local Linux workspace.
- Models: parent session model as recorded by the client; development agents inherit it; independent plan/final review explicitly requested as `gpt-6-astra`, high effort. Exact effective metadata belongs to the preserved sessions.
- Started with an empty project folder and standard React/Vite libraries. Earlier Decibel concept by the author inspired the classroom idea; no older app code imported.
- Hosting choice made by the agent under the user's delegation: ChatGPT Sites, Cloudflare Worker + D1, platform sign-in. Initial Mongo/Vercel backend was replaced, with no production school database accessed or reused.
- Skills/instructions: user AGENTS.md, Sites, subagent-dev-with-codex, plan-auditor, Impeccable. The repository includes the specific brief and design decisions. Skills are disclosed as build assistance, not authored product code.
- Manual application edits: none observed in these sessions. Setup/authentication already existed. Do not infer that the user made changes from pre-existing machine configuration.
- Original procedural creature graphics and teaser; locally hosted DM Sans/Fraunces with font licenses. MIT application license.

## History and verification

Keep both original Codex conversations and their subagents until judging ends. Public human-readable exports must be reviewed for secrets and third-party personal information; clearly mark any redaction. A final export can only include the final answer after the turn is finished: use the client's full-thread export/share after delivery, then attach it here or in Discord. Do not substitute a highlights-only log for the required full history. This file is a submission draft until that export and the verification checklist are complete.

## Required delivery evidence

- [ ] Public deployment and URL
- [ ] Public source version
- [ ] Chrome deployed anonymous + authenticated paths
- [ ] Persistent D1 scoring and isolation tests
- [ ] Teaser MP4
- [ ] Astra final review and chosen improvements
- [ ] Full readable conversation history, reviewed redactions
