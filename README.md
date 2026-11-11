# Hushwood

A small sound adventure for a whole classroom. Keep a forest companion comfortable, build a quiet streak, and grow together.

**Public game:** use a microphone with no account. Audio stays on the device. A simulation lets you try the mechanics without granting microphone access.

**School mode:** sign in with ChatGPT, create a school, invite teachers, add classes and run a school cup. Save aggregate lesson progress and configure collective rewards. No student accounts or names.

## Development

```sh
npm ci
npm test
npm run build
npx wrangler d1 migrations apply DB --local
npm start
```

English is the default, with Italian, French, German, Spanish and Portuguese. The projector view is designed for daylight classrooms. Measurement is relative microphone amplitude, **not calibrated decibels**. Devices and rooms differ; calibrate with the class. The cup is a cooperative teaching aid, not a tamper-proof competition.

See [deployment](docs/DEPLOYMENT.md), [privacy and classroom use](docs/PRIVACY.md), [build plan](docs/PLAN.md) and [submission notes](docs/SUBMISSION.md).

## Original work and license

Created during the Ten Prompt Build event, from an empty directory. An earlier classroom sound game by the same author inspired the idea; its code and features were not imported. Standard React/Vite and Cloudflare libraries are used. All newly authored application code is MIT licensed. Font licenses are preserved in `public/fonts/`.

Development and review were performed with Codex agents. The prompt ledger and build-history instructions describe the original attempt and subsequent Sites direction, including incomplete attempts. This repository does not claim a single prompt if the full history contains more.
