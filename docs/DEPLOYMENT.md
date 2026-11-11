# Run and deploy

Hushwood uses React/Vite, a Cloudflare Worker, D1 and ChatGPT Sites identity. No Atlas account or MongoDB credentials are required. The managed deployment uses the DB included in the owner's Sites plan; usage is still subject to platform quotas.

```
npm ci
npm test
npm run build
npx wrangler d1 migrations apply DB --local
npm start
```

Local preview supports the anonymous microphone game. School identity is established by the Sites platform in production. Tests inject a synthetic identity into the Worker directly; no such login bypass is deployed. Never expose an alternate Worker URL that blindly trusts client-supplied identity headers: put it behind a trusted authentication proxy that strips/replaces these headers.

The source manifest `.openai/hosting.json` declares D1 binding `DB`. SQL migrations and Drizzle metadata are in `drizzle/`. Sites applies these migrations before the Worker deployment. `npm run build` compiles the frontend and bundles a self-contained Worker at `dist/server/index.js`; static assets are included, avoiding an external asset service.

Publish through the Sites skill source workflow: push the exact source commit, package it, save a version, deploy that version, and verify the returned deployment state. The native Sites project is public so the landing and microphone game work anonymously. API school operations require authenticated membership. A custom hostname must be verified via the Sites custom-domain tool and DNS before it is advertised as live.

Open-source reuse: create your own Site and replace the project ID through the supported helper. Do not deploy against the original project identity. Alternatively adapt the identity boundary to your own trusted provider, and bind your own D1 database.
