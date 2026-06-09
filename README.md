# policydiff

`policydiff` turns noisy JSON/YAML policy and config changes into a reviewer-ready risk summary: what permission widened, what guardrail vanished, and where to look first. It is local-first, fast, and designed for pull request reviews and agent safety gates.

## Install

```bash
npm install -g policydiff
```

For local development:

```bash
npm install
npm run build
node dist/cli.js --help
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

## What it detects

- Generic JSON/YAML additions, removals, and changes.
- Permission, scope, role, allowlist, and tool access widening.
- Removed or disabled approvals, enforcement, branch protection, and guardrails.
- GitHub Actions permission changes such as `contents: read` → `write`.
- Package lifecycle or executable script changes.
- Network exposure/CORS changes and secret-adjacent path changes.

`policydiff` is not a formal verifier. It is a practical reviewer assistant that highlights likely-risky config diffs.

## Verification

```bash
npm test
npm run check
npm run build
npm run smoke
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

The package smoke uses `npm pack --dry-run` so the published file list can be reviewed without publishing.
