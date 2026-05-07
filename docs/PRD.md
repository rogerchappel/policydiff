# policydiff

Status: in-progress
Decision: selected for 2026-05-08 OSS factory run

## Scorecard

Total: 82/100
Band: build now
Last scored: 2026-05-08
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 16/20 | Security reviews struggle to see meaningful changes in policy/config JSON/YAML across commits. |
| Demand signal | 15/20 | OPA, Kubernetes, GitHub settings, OpenAPI, and agent tool policies all create config-diff pain. |
| V1 buildability | 18/20 | Parse YAML/JSON, normalize, diff paths, classify additions/removals/risk patterns. |
| Differentiation | 14/15 | Opinionated safety summaries for agent/tool policies and repo governance configs. |
| Agentic workflow leverage | 12/15 | Agents can run it before changing permissions, workflows, branch rules, or manifests. |
| Distribution potential | 7/10 | Clear name and CLI workflow; strong examples. |

## Pitch

`policydiff` turns noisy JSON/YAML policy changes into a readable risk summary: what permission widened, what guardrail vanished, and where reviewers should look first. 🛡️

## Why It Matters

A one-line config change can quietly grant write access, disable approvals, relax CORS, or change an agent tool allowlist. Generic diffs show syntax; reviewers need intent-shaped summaries.

## Attribution / Inspiration

Inspired by policy-as-code review tools and security diff workflows, reframed as a tiny local-first CLI for developers and agentic systems.

## V1 Scope

- TypeScript CLI package.
- `policydiff compare <before> <after>` for JSON/YAML files or directories.
- Normalize object keys for deterministic output.
- Path-level additions/removals/changes with severity heuristics.
- Rule packs for generic config, GitHub Actions permissions, package scripts, and agent/tool allowlists.
- Output as text, markdown, or JSON.
- `policydiff explain <diff.json>` renders reviewer notes.
- Fixtures covering safe, warning, and dangerous config changes.
- README examples for PR review and agent safety gates.

## Out of Scope

- Formal policy verification, full Rego evaluation, SaaS integrations, or claiming complete security coverage.

## Verification

- `npm test`
- `npm run check`
- `npm run build`
- `npm run smoke`
- Real CLI smoke comparing fixture policies.

## Agent Prompt

Build a polished local-first TypeScript CLI named `policydiff` from this PRD. Make it practical for repo governance and agent tool-policy reviews. Publish as `rogerchappel/policydiff` after verification.
