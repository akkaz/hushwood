#!/usr/bin/env python3
"""Export user-visible dialogue. Raw sessions remain private in the Codex archive.
This is a readable companion, NOT a replacement for a client's full-thread export.
"""
import json, pathlib, re
root=pathlib.Path('/home/akkaz/.codex/sessions/2026/11/11')
parent_ids={'01a1ca11-e305-7e63-9365-4e2f0d163a8a','01a1ca15-aac5-74e2-8d17-c9ec9ce50484','01a1ca1b-2ea2-77a2-9a50-435ed1f5be03'}
files=[]
for candidate in sorted(root.glob('*.jsonl')):
 meta=json.loads(candidate.open().readline()).get('payload',{})
 if meta.get('id') in parent_ids or meta.get('parent_thread_id') in parent_ids: files.append(candidate)

out=pathlib.Path(__file__).resolve().parents[1]/'docs/history/dialogue.md'
parts=['# Human-readable dialogue companion\n\nPartial while the session is running. Tool internals and injected memory are excluded from this companion because they can contain credentials or unrelated third-party information. Preserve original complete sessions; use the final client share/export for competition verification. No tool result here is presented as a full transcript.\n']
for p in files:
 parts.append('## Conversation '+p.stem+'\n')
 for line in p.open():
  row=json.loads(line); item=row.get('payload',{})
  if row.get('type')!='response_item' or item.get('type')!='message' or item.get('role') not in ('user','assistant'):continue
  if item.get('role')=='assistant' and item.get('channel') not in (None,'final','commentary'):continue
  text='\n'.join(c.get('text','') for c in item.get('content',[]) if isinstance(c,dict))
  if not text:continue
  if text.startswith('# AGENTS.md instructions'):text='[Supporting user instructions: see user-instructions.txt. Environment-only metadata omitted.]'
  if text.startswith('<codex_internal_context source="goal">'):text='[Automatic goal continuation supplied by the client; not a manually entered new prompt.]'
  text=re.sub(r'(?:gh[opusr]_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{16,})','[REDACTED credential]',text)
  parts.append('### '+item['role']+'\n\n'+text+'\n')
out.write_text('\n'.join(parts))
# Supporting instructions used for the build are part of disclosure.
for line in (root/'rollout-2026-11-11T11-15-41-01a1ca1b-2ea2-77a2-9a50-435ed1f5be03.jsonl').open():
 row=json.loads(line);item=row.get('payload',{})
 if row.get('type')=='response_item' and item.get('role')=='user':
  text='\n'.join(c.get('text','') for c in item.get('content',[]) if isinstance(c,dict))
  if text.startswith('# AGENTS.md instructions'):
   (out.parent/'user-instructions.txt').write_text(text.split('<environment_context>')[0]);break
print(out)
