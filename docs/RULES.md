# Rule heuristics

`policydiff` classifies structural JSON/YAML changes with deliberately simple local heuristics.

| Category | Examples | Typical severity |
| --- | --- | --- |
| Permission widening | `read` to `write`, new allowlist/tool/scope entry | high |
| Guardrail removal | approvals, enforcement, protection, deny/block settings disabled or removed | critical |
| GitHub Actions permissions | `contents: write`, `pull-requests: write` | high |
| Package scripts | `postinstall`, `prepare`, executable script changes | high |
| Network exposure | CORS wildcard or origin/host changes | medium |
| Secret-adjacent | `token`, `password`, `secret`, `private`, and explicit compound keys such as `accessToken` or `privateKey` | medium |

Path rules match complete, case-insensitive JSON Pointer segments after decoding
`~0` and `~1`. For example, `/roles`, `/tools/allow`, and `/scripts/build` match,
while descriptive keys such as `/rolesDescription` and `/transcripts` do not.
Selected compound keys are matched with anchored patterns: examples include
`requireApproval`, `githubWorkflow`, `clientSecret`, `accessToken`, and
`privateKey`. Unrelated substrings such as `notrequired` and `privateer` are not
classified.

Boolean guardrail additions are classified by their effective value. Adding a
supported guardrail key with `false` is treated as removed or disabled
(`guardrail.removed`, critical), while adding it with `true` is treated as added
or enabled (`guardrail.added`, low).

These are review prompts, not proof of vulnerability. Prefer safe defaults and add targeted tests when introducing new heuristics.
