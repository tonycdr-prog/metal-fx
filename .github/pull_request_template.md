## Scope

- Concern addressed:
- Why this change is focused:
- Explicit non-goals:

## Hygiene review

- [ ] The change keeps one clear responsibility per module.
- [ ] Files above 250 nonblank lines have a current review entry; files above 350 are decomposed or explicitly excepted.
- [ ] Shared state, observers, listeners, RAF work, and injected DOM have explicit cleanup and focused verification.
- [ ] Public API changes are explicit and intentional.
- [ ] No dead script, unused dependency, orphan/duplicate asset, or package debris was introduced.
- [ ] Tests are co-located or under `tests/e2e/` / `tests/package/`.
- [ ] No unrelated refactor, dependency upgrade, or formatting sweep is mixed into this change.

## Verification

- [ ] `npm ci`
- [ ] `npm run check`

Commands and results:

```text
Paste concise verification output here.
```

## Senior-review triggers

- [ ] Not applicable, or senior review completed for shared renderer architecture, SSR/hydration, fallback behavior, or lifecycle ownership.
