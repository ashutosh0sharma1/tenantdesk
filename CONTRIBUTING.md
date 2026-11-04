# Contributing to TenantDesk

Start with a small change that somebody can reproduce from a clean checkout. This is an experimental public source release; the README and VALIDATION.md describe the supported scope.

## Find the code

`lib/store.ts` contains fictional projects, sessions and local persistence; `app/api/[...path]/route.ts` enforces authorization and mutation validation.

## Useful contributions

- Replace demo identity behind a provider interface, retaining cross-tenant denial tests.
- Move project persistence to a transactional store and test concurrent updates.
- Add accessibility coverage for the client and administrator views using synthetic data.

## Verify a change

Install the README dependencies, then run the relevant checks:

```sh
npm run lint
npm run typecheck
# With the local server running:
npm test
npm run build
```

Run only checks appropriate to your change. Do not turn a unit test into a live provider call, model download, deployment or mutation of a real account. Keep optional integration acceptance explicit and report skipped prerequisites.

## Submit a pull request

Explain the observed problem, the resulting behavior, and the evidence used to verify it. Include a small synthetic reproduction for a bug. Keep unrelated formatting out of the change. Preserve upstream copyright/license notices and identify any new dependency and its license. Contributions are made under the applicable repository/source-file license.

Never include credentials, signed URLs, personal recordings, private transcripts, customer data, production exports or unlicensed media. Security reports belong in GitHub's private vulnerability reporting channel when available; do not post secrets in a public issue.
