# Security Policy

## Supported Versions

`policydiff` is pre-1.0. Security fixes are provided on the latest released version and the `main` branch as maintainer capacity allows.

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| < 0.1.0 | No |

## Reporting a Vulnerability

Please use GitHub private vulnerability reporting when available for `rogerchappel/policydiff`. If it is not enabled, open a public issue asking for a private contact path **without** including exploit details, secrets, private policy files, or sensitive configuration.

## Handling Sensitive Policy Files

`policydiff` is local-first and does not upload files. When reporting bugs, reduce inputs to minimal sanitized JSON/YAML fixtures before sharing them publicly.

## Scope

In scope:

- Vulnerabilities in the CLI parser, renderer, packaging, release, or CI configuration.
- Insecure default guidance shipped by this project.

Out of scope:

- Security issues in downstream policy files analyzed by `policydiff`.
- General support requests or requests for guaranteed maintenance timelines.
