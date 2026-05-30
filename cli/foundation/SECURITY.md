# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |
| < 0.1   | ❌        |

Security fixes are backported only to the latest minor release.

## Reporting a Vulnerability

**Please do not open a public issue.**

Use one of the following private channels:

1. **Preferred** — Email `longtho638@gmail.com` with subject prefix
   `[security] mekong-foundation: <one-line summary>`.
2. **Alternative** — Open a [GitLab confidential issue](https://gitlab.com/agency.os/mekong-foundation/-/issues/new?issue%5Bconfidential%5D=true)
   on the canonical project (set "Confidential" on the issue creation form).

Please include:

- A clear description of the vulnerability and its impact.
- Steps to reproduce or a proof-of-concept (minimal).
- The affected version(s) and configuration.
- Your name/handle if you would like to be credited.

## Disclosure Timeline

- **Acknowledgement:** within 3 business days.
- **Triage and severity assessment:** within 7 business days.
- **Fix and coordinated disclosure:** within 90 days; earlier if a public
  exploit is observed.

We will credit reporters in the changelog and the published advisory unless
anonymity is requested.

## Out of Scope

- Findings that require physical access to the user's machine.
- Self-inflicted denial of service via local resource exhaustion.
- Issues exclusive to unsupported versions (see table above).
