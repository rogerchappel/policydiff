# OSS factory orchestration

This MVP was built as a local-first CLI with small, independently reviewable stages:

1. Preserve product requirements in `docs/PRD.md`.
2. Establish package metadata, TypeScript build, and CLI surface.
3. Implement parsing, normalization, structural diffing, classification, and rendering.
4. Add fixtures and tests for safe, warning, and dangerous changes.
5. Add project hygiene: README, security, contributing, examples, CI, and validation.
6. Run verification, publish `rogerchappel/policydiff`, and protect `main` best-effort.

The CLI is intentionally offline: inputs stay on the user's machine, and JSON reports can be attached to pull requests or agent review logs.
