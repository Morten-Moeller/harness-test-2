# 0009: Verifikation vor dem Merge, G3 als Status verified

Status: accepted
Datum: 2026-11-11
Spec: docs/specs/0005-harness-0-6-0.md
Ersetzt Grundregeln: keine

## Kontext

Bis Harness 0.5.0 lief `/verify` in diesem Projekt zweimal nach dem Merge (PR #9 und #11), weil
nichts die Reihenfolge erzwang: `human-gate` prüfte nur das Label, und `implement` nannte
`/verify` nicht als nächsten Schritt. Harness 0.6.0 (Entscheidung 0018 im Harness-Repository)
lässt `verify` vor dem Merge laufen, setzt den Commit-Status `verified` und prüft ihn im
`human-gate` für die Stufen aus `verify_required_for`.

## Optionen

### Option A: `verify_required_for: high`

- Vorteile: Die Vorgabe des Harness; high-risk-PRs (Contracts, Policies, Workflows) merged nichts
  ohne geprüften Head. Medium-PRs bleiben leichtgewichtig, `implement` lässt `verify` dort
  trotzdem laufen.
- Nachteile: Ein medium-PR kann mit Label, aber ohne `verified` merged werden.

### Option B: `verify_required_for: medium`

- Vorteile: Jeder PR mit Label hat einen geprüften Head.
- Nachteile: Jeder Push auf einen medium-PR braucht `verify` vor dem Label; mehr Läufe für eine
  Person.

### Option C: `verify_required_for: ""`

- Vorteile: Keine Änderung im Ablauf.
- Nachteile: Die Reihenfolge bleibt Disziplin; der Anlass dieses ADRs bleibt bestehen.

## Entscheidung

Option A. Der Schlüssel steht in `harness/config.yml`; `verify` schreibt die Spec-Zeile als
`done` vor dem Merge, der Status `fertig` entfällt. Ein Wechsel auf Option B kommt mit der zweiten
Person im Projekt.

## Folgen

- `docs/specs/README.md`: Statuswerte ohne `fertig`.
- Ablauf je PR: `implement` bis zum PR, `review`, CI, `verify`, dann das Label.
- `harness/policies/human-approval.md` (harness-owned) beschreibt G3 als Status `verified`.
