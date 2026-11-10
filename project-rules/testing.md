# Testing rules

## Levels

| Level | Tool | Runs in | Scope |
|---|---|---|---|
| frontend unit | Vitest through `ng test` (jsdom) | `make test` | one component or service, `HttpClient` replaced by `provideHttpClientTesting` |
| backend unit | JUnit 5 | `make test` | one service, no Quarkus start |
| backend API | `@QuarkusTest` with RestAssured | `make test` | one resource over HTTP, in-memory storage |
| end-to-end | none yet | – | added with its own spec when needed |

## Rules

- A change to behaviour comes with a test that fails without the change.
- Tests are named after the behaviour: `it('marks an item as done', ...)`,
  `void marksItemAsDone()`.
- Frontend specs sit next to the file they test (`*.spec.ts`). Backend tests mirror the package
  under `backend/src/test/java`.
- Test data through small builder functions in the test files. No reflection into private state.
- Flaky tests are fixed or deleted in their own PR, never retried in CI.

## What `/verify` runs

- Affected tests: `make test` (both sides are fast enough to run in full).
- Browser checks: start `make dev-backend` and `make dev-frontend`, open http://localhost:4200.
  No login. Test data is created through the UI or with `curl` against http://localhost:8080/api.
