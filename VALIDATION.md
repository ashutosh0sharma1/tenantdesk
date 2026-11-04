# Validation

Release preparation: 2026-11-04. These are results from the clean source export on Windows; the workflow badge reports subsequent fresh Linux CI results.

## Verified

18 direct API integration tests passed against a dedicated local production server; lint, type checks and build passed.

## Limits

Tests cover cross-tenant denial, session rejection, origin checks, input validation and ownership protection. The release uses fictional accounts with a public demo password; it is not a production identity system.

Provider credentials were excluded from test environments. Test success does not establish production readiness or compatibility with every machine. Reproduce the documented checks after installing dependencies; report failures with synthetic fixtures and environment versions.
