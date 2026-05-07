# Rule heuristics

`policydiff` classifies structural JSON/YAML changes with deliberately simple local heuristics.

| Category | Examples | Typical severity |
| --- | --- | --- |
| Permission widening | `read` to `write`, new allowlist/tool/scope entry | high |
| Guardrail removal | approvals, enforcement, protection, deny/block settings disabled or removed | critical |
| GitHub Actions permissions | `contents: write`, `pull-requests: write` | high |
| Package scripts | `postinstall`, `prepare`, executable script changes | high |
| Network exposure | CORS wildcard or origin/host changes | medium |
| Secret-adjacent | paths containing token, password, secret, private | medium |

These are review prompts, not proof of vulnerability. Prefer safe defaults and add targeted tests when introducing new heuristics.
