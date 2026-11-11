---
sources: []
---

# Testing rules

The general rules are in `harness/testing.md` (T1 to T7). This file names the tools, commands,
areas and test data of the project. A rule of `harness/testing.md` that does not fit is replaced
by an ADR that names its number.

## Levels

| Level | Tool | Runs in | Scope (harness/testing.md T1) |
|---|---|---|---|
| frontend unit | Vitest through `ng test` (jsdom) | `make test` | one component or service as a user operates it, `HttpClient` replaced by `provideHttpClientTesting` |
| backend unit | JUnit 5 | `make test` | pure calculations and validation rules, table-driven |
| backend API | `@QuarkusTest` with RestAssured | `make test` | one resource over HTTP against the storage of the application; today in-memory, a database container as soon as the project has a database |
| end-to-end | none yet | `make e2e` prints "no end-to-end tests configured" | added with its own spec when needed |

## Additions

- Frontend specs sit next to the file they test (`*.spec.ts`). Backend tests mirror the package
  under `backend/src/test/java`.
- Builders: small builder functions in the test files with defaults; the test states only the
  values it is about.
- Coverage floor: none.

## Areas

Which tests belong to which source paths. `implement` and `/verify` run the tests of the areas a
change touches. Both sides are fast enough to run in full with `make test`.

| Source path | Unit and integration | End-to-end |
|---|---|---|
| `frontend/src/app/items/` | `frontend/src/app/items/*.spec.ts` | none |
| `frontend/src/app/app.*` | `frontend/src/app/app.spec.ts` | none |
| `backend/src/main/java/de/mmoller/einkaufsliste/item/` | `backend/src/test/java/de/mmoller/einkaufsliste/item/` | none |

## End-to-end

- Start: no end-to-end tests yet. The first spec that adds them chooses Playwright with
  `webServer`, so the tests start frontend and backend themselves and `e2e_in_ci: true` becomes
  possible.
- One spec: none.
- Session setup (T6.2): no login in the application.
- Environment check (T4.3): none; added with the first end-to-end test.

## Test data

- Command: none yet. The storage is in memory and starts empty with every backend start. The
  first spec that needs a prepared state adds the command here (for example `make seed
  STATE=<name>`), which prints one JSON document per call (`ok`, `data`, `error.code`).
- Environment check: none yet (`make seed-doctor` comes with the command).
- Named states: none yet. Until then the only state is `empty` (backend restarted).
- Never write rows by hand, never call internal endpoints, never click through the application to
  make data that the command makes. A state the command lacks goes into a spec; the command is
  extended there.

## What `/verify` runs

- Automated: `make check` and the tests of the touched areas (table Areas).
- Browser checks: start `make dev-backend` and `make dev-frontend`, open http://localhost:4200.
  No login. Test data state: `empty`. Data that the verified flow itself creates comes from that
  flow.
