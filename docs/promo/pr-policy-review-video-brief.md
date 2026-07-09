# PR Policy Review Video Brief

## Angle

Show how `policydiff` turns a noisy config change into a reviewer-ready risk summary before a policy or workflow PR is merged.

## Grounded demo beats

1. Use the checked-in `fixtures/before` and `fixtures/after` directories.
2. Run `bash demo/run-pr-policy-review.sh`.
3. Explain that exit code `2` means comparison succeeded and at least one critical change was detected.
4. Open `/tmp/policydiff-demo/policy-review.md`.
5. Point at concrete categories from the report: permission widening, removed guardrails, workflow permission changes, package script changes, network exposure, or secret-adjacent paths when present in the fixture output.

## Suggested short script

```text
Some pull requests change policy files, GitHub workflow permissions, or package scripts. Those diffs are noisy, and the risky lines are easy to miss.

policydiff compares the before and after directories, writes a JSON report, and turns it into Markdown that a reviewer can paste into a PR.

It is not a formal verifier. It is a local-first reviewer assistant that names likely-risky config changes so humans know where to look first.
```

## Capture checklist

- Terminal: `bash demo/run-pr-policy-review.sh`
- File view: `/tmp/policydiff-demo/policy-review.md`
- README line: exit code `2` means critical change detected
- Limitation to say plainly: heuristic risk summary, not a proof of safety
