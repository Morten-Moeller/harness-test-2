# 0003: Validierungsfehler mit dem Quarkus-Standardbody statt RFC 9457

Status: accepted
Datum: 2026-11-11
Spec: docs/specs/0002-harness-0-5-0.md
Ersetzt Grundregeln: A2.3

## Kontext

A2.3 verlangt eine Fehlerform für die ganze API: RFC 9457 Problem Details mit stabilem
`errorCode`. Feature 0001 antwortet auf ungültige Eingaben mit HTTP 400 und dem Standardbody von
`quarkus-hibernate-validator` (`project-rules/backend.md`, Abschnitt Errors). Der Contract
beschreibt den Body nicht. Das Frontend zeigt eine eigene Meldung und liest den Body nicht.

## Optionen

### Option A: Quarkus-Standardbody behalten

- Vorteile: Kein eigener Code; das Frontend prüft die Eingaben selbst und braucht den Body nicht.
- Nachteile: Kein `errorCode`, Clients können nur auf den Status reagieren; der Body ist nicht
  Teil des Contracts.

### Option B: RFC 9457 mit `errorCode` einführen

- Vorteile: Entspricht A2.3; ein zweiter Client kann auf Fehlercodes reagieren.
- Nachteile: ExceptionMapper, Schema im Contract, Anpassung des Frontends; eine brechende
  Contract-Änderung (`contracts/README.md`).

## Entscheidung

Option A, solange das Frontend der einzige Client ist und jede Eingabe vor dem Senden selbst
prüft. Der erste Endpunkt, dessen Fehlerursache das Frontend unterscheiden muss, oder der erste
zweite Client führt Option B in einer eigenen Spec ein.

## Folgen

- `project-rules/backend.md` bleibt wie er ist.
- Specs mit mehreren Fehlerursachen pro Endpunkt nennen dieses ADR und lösen es ab.
