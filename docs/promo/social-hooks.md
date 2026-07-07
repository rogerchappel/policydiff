# Policydiff Social Hooks

Draft posts grounded in current `policydiff` behavior: local JSON/YAML compare,
risk-oriented rules, Markdown/JSON/text output, and critical-change exit code
`2`.

## Short posts

1. Policy reviews get noisy fast. `policydiff` turns JSON/YAML before-and-after
   changes into a reviewer-ready risk summary.
2. Demo: add `exec` to an agent policy and disable approval. `policydiff`
   highlights both the permission widening and removed guardrail.
3. Use Markdown output for PR reviewers and JSON output for automation. No
   remote service is needed.
4. A critical policy change exits `2`, which makes it easy to gate CI without
   treating the compare itself as a parser failure.

## Demo command

```bash
npm run build
bash demo/agent-policy-review.sh
```

## Launch note draft

`policydiff` is a local-first CLI for comparing JSON/YAML policy and config
changes. It highlights generic additions/removals plus reviewer-relevant risk
signals such as widened permissions, removed approvals, package lifecycle script
changes, CORS/network exposure, and secret-adjacent paths.

Limitations: it is a practical review assistant, not a formal verifier. It does
not prove a policy is safe and should be paired with human review for production,
security, billing, and auth changes.
