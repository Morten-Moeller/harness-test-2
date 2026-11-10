# Frontend rules

## Stack

- Angular 22 in `frontend/`, standalone components, zoneless change detection.
- Node from `.nvmrc` (24.22.2), pnpm 11 (`packageManager` in `frontend/package.json`).
- Build and dev server: Angular CLI (`@angular/build`). `make dev-frontend` serves
  http://localhost:4200.

## Structure

- One folder per feature under `frontend/src/app/<feature>/`: component, template, styles, spec,
  and the service that talks to the backend.
- Shared UI pieces go to `frontend/src/app/shared/`. A feature never imports from another feature;
  shared code moves to `shared/` first.
- Routes are declared in `app.routes.ts`, lazy per feature once there is more than one.

## State and data

- Component state in signals (`signal`, `computed`). No NgRx.
- Server data through one service per feature with `HttpClient`, under the path `/api`. The dev
  server proxies `/api` to http://localhost:8080 (`proxy.conf.json`, added with the first API).
- Types for requests and responses come from the contract in `contracts/` once it exists. No
  hand-written copies of backend types next to a generated one.

## UI

- Plain CSS per component, no component library for now.
- User-facing text is German and written directly in the templates; there is no i18n framework.
- Accessibility: every control has a label, everything is reachable by keyboard, focus is visible.
  Colour values are a design decision; report contrast problems, do not change colours on the way.

## Quality

- `make frontend-typecheck`: `tsc` for app and specs. `make frontend-lint`: angular-eslint and
  Prettier (`.prettierrc`). `make format` fixes formatting.
- No `any` in new code, no `@ts-ignore`, no `eslint-disable` without a `Gate-Änderung` line in the
  PR.
