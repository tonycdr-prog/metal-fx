# Releasing metal-fx

The package identity is `@tonycdr-prog/metal-fx`. It intentionally does not reuse the upstream unscoped `metal-fx`
registry name. The source repository remains private, while the configured npm package is public.

## One-time npm setup

1. Create or confirm the `tonycdr-prog` user or organization scope on npm.
2. Grant the publishing account write access to `@tonycdr-prog/metal-fx`.
3. Add a granular npm access token with publish permission and 2FA bypass as the repository secret `NPM_TOKEN`.
4. Protect the GitHub `npm` environment if release approval is required.

Do not create a release tag until this setup is complete. On 2026-07-15 the registry returned `E404` for this package;
recheck it during release preparation because that observation will become stale after first publication. An `E404`
does not prove ownership of the scope.

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
6. Approve the protected `npm` environment, if configured, and inspect the workflow provenance and package contents.

The publish workflow rejects a tag that does not exactly match `package.json` and runs the complete quality gate on
Node 22 and 24 before the single Node 24 publish job. Pull requests, branches, and unmatched tags cannot publish.

## First-release checks

- Confirm the npm package page shows public visibility and the expected scope.
- Install the exact released version into clean CommonJS, ESM, and strict TypeScript fixtures.
- Confirm the provenance points to `tonycdr-prog/metal-fx` and the tagged commit.
- Confirm the six-file tarball allowlist is unchanged.
- Confirm the GitHub Pages demo is already deployed from the same main history.

Publishing, tagging, creating the npm scope, and adding credentials are external release actions; repository validation
does not perform them automatically.
