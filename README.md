# policydiff

`policydiff` turns noisy JSON/YAML policy and config changes into a reviewer-ready risk summary: what permission widened, what guardrail vanished, and where to look first. It is local-first, fast, and designed for pull request reviews and agent safety gates.

## Install

```bash
npm install -g @rogerchappel/policydiff
policydiff --version
```

For local development:

```bash
npm install
npm run build
node dist/src/cli.js --help
```

## Quickstart

Run the checked-in policy fixture comparison and print the reviewer summary:

```bash
npm install
npm run build
node dist/src/cli.js compare fixtures/before fixtures/after --format text
```

For a release-style smoke, write JSON evidence and render the explanation:

```bash
node dist/src/cli.js compare fixtures/before fixtures/after --format json --output /tmp/policydiff-smoke.json
node dist/src/cli.js explain /tmp/policydiff-smoke.json --format markdown
```

## Compare files or directories

```bash
policydiff compare fixtures/before fixtures/after
policydiff compare policy.before.yml policy.after.yml --format markdown
policydiff compare before after --format json --output policydiff.json
```

Example text output:

```text
policydiff report
Summary: 8 change(s), highest severity critical
• [high] /permissions/contents changed: Permission, role, scope, or allowlist widened. (permission.widened)
• [critical] /requireApproval changed: Review, enforcement, or guardrail appears removed or disabled. (guardrail.removed)
```

## Explain saved reports

```bash
policydiff compare fixtures/before fixtures/after --format json --output diff.json
policydiff explain diff.json --format markdown
```

## Demo walkthrough

Try the agent-policy review demos with checked-in before/after fixtures:

```sh
bash demo/agent-policy-review.sh
bash demo/run-agent-policy-review.sh
bash demo/review-agent-policy-change.sh
```

The demos compare checked-in agent-policy fixtures, save JSON evidence, and
explain reports as Markdown. See
[Agent Policy Review Demo](docs/tutorials/agent-policy-review.md) and
[docs/tutorials/review-agent-policy-change.md](docs/tutorials/review-agent-policy-change.md)
for reviewer workflows, expected critical exit codes, and generated review
files.

Use [`examples/pr-comment-template.md`](examples/pr-comment-template.md) when
attaching the demo report to a pull request review. For promotion or screencast
prep, see [`docs/promo/video-brief.md`](docs/promo/video-brief.md).

For a narrower GitHub Actions permission review, run:

```sh
bash demo/github-actions-permissions-review.sh
```

This compares the checked-in workflow fixtures and writes Markdown plus JSON
evidence under `${TMPDIR:-/tmp}/policydiff-actions-permissions`. Promotion-ready
hooks live in
[`docs/promo/github-actions-permissions-social-hooks.md`](docs/promo/github-actions-permissions-social-hooks.md).

## What it detects

- Generic JSON/YAML additions, removals, and changes.
- Permission, scope, role, allowlist, and tool access widening.
- Removed or disabled approvals, enforcement, branch protection, and guardrails.
- GitHub Actions permission changes such as `contents: read` → `write`.
- Package lifecycle or executable script changes.
- Network exposure/CORS changes and secret-adjacent path changes.

Wholly added or removed JSON/YAML files are expanded into deterministic leaf
changes. This lets the same path-based rules classify their settings—for
example, an added workflow containing `permissions.contents: write` is reported
at `/permissions/contents` as a high-severity GitHub Actions permission change.

When both compare inputs are standalone files, they form one logical
before/after pair even when their basenames differ. The report's file `path`
uses the after file's basename. Directory inputs continue to pair files by
their relative paths.

Scalar arrays below `permissions`, `scopes`, `allow`, `allowed`, `tools`,
`capabilities`, or `roles` paths are compared as unordered multisets. Reordering
the same entries therefore produces no change, while additions and removals
retain deterministic indexed paths and their permission severity. Arrays on
other paths—and arrays containing objects or nested arrays—remain
order-sensitive.

`policydiff` is not a formal verifier. It is a practical reviewer assistant that highlights likely-risky config diffs.

YAML input must use unique mapping keys at every nesting level. Duplicate keys
are rejected as parsing errors instead of silently keeping one value; the CLI
identifies the affected file and exits with status `1`. JSON parsing retains
the runtime's standard `JSON.parse` behavior.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
bash scripts/validate.sh
```

## Exit codes

- `0`: compare/explain succeeded and no critical change was detected.
- `1`: CLI or parsing error.
- `2`: compare succeeded and at least one critical change was detected.

## Development

See [docs/PRD.md](docs/PRD.md), [docs/TASKS.md](docs/TASKS.md), and [docs/ORCHESTRATION.md](docs/ORCHESTRATION.md).

## Security

See [SECURITY.md](SECURITY.md). Please do not paste private policy files into public issues; reduce to a minimal sanitized fixture.

## License

MIT

## Release Readiness

Use the checked-in scripts before opening or publishing a release:

```sh
npm run check
npm test
npm run build
npm run smoke
npm run package:smoke
npm run release:check
```

The package identity check verifies that the npm name is either unclaimed or
already points at this repository. The package smoke installs the generated
tarball into a temporary prefix and runs its `policydiff` binary and version,
without publishing.
