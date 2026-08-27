# Releasing metal-fx

The package identity is `@tonycdr-prog/metal-fx`. It intentionally does not reuse the upstream unscoped `metal-fx`
registry name. The audited MIT-licensed source repository and release artifact are public.

## One-time GitHub setup

1. Keep `tonycdr-prog/metal-fx` public so consumers can download the package without credentials.
2. Enable immutable releases in the repository settings. This locks a published release's tag and assets and creates
   a GitHub release attestation.
3. Protect `main` and require the Node 22, Node 24 and browser checks before merge.

No npm account, npm token, GitHub Actions secret or consumer GitHub credential is required for this pilot
distribution. Do not create a release tag until release immutability and branch protection are confirmed.

## Release sequence

1. Choose the release version and update `package.json` plus `package-lock.json` in a dedicated release PR.
2. Summarize the user-visible changes in the GitHub release notes.
3. From a clean checkout, run:

   ```bash
   npm ci
   npm run check
   npm run test:browser
   npm run release:check -- vX.Y.Z
   npm pack --dry-run
   ```

4. Merge only after required CI and senior review are green.
5. Create and push the exact matching annotated tag `vX.Y.Z` from the reviewed main commit.
6. Inspect the immutable GitHub release, release attestation, checksum and package contents.

The publish workflow rejects a tag that does not exactly match `package.json` and runs the complete quality gate on
Node 22 and 24 before the single Node 24 release job. It creates a draft, attaches the package and checksum, publishes
the now-immutable release, then verifies both assets against GitHub's attestation. Pull requests, branches and
unmatched tags cannot publish.

## First-release checks

- Confirm the release is marked immutable and its tag points to the reviewed `main` commit.
- Verify the downloaded tarball with `gh release verify-asset` and the published SHA-256 checksum.
- Install the exact release-asset URL into clean CommonJS, ESM, strict TypeScript and React 19 fixtures.
- Confirm the GitHub release attestation points to `tonycdr-prog/metal-fx` and the tagged commit.
- Confirm the six-file tarball allowlist is unchanged.
- Confirm the GitHub Pages demo is already deployed from the same main history.

Tagging and publishing the immutable GitHub release are external release actions. Repository validation does not
perform them automatically.
