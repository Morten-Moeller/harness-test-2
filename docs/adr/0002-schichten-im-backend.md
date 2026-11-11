# 0002: Resource, Service und Repository pro Feature im Backend

Status: proposed
Datum: 2026-11-11
Spec: docs/specs/0002-harness-0-5-0.md
Ersetzt Grundregeln: A1.2, T1.1, T1.3

## Kontext

`harness/architecture.md` A1.2 verbietet eine Service-Schicht und ein Repository, solange nur eine
Implementierung existiert. `project-rules/backend.md` schreibt pro Feature Resource, Service und
Repository vor; Feature 0001 ist so gebaut (`backend/src/main/java/de/mmoller/einkaufsliste/item/`).
`ItemServiceTest` prüft den Service direkt statt über HTTP (T1.1, T1.3).

## Optionen

### Option A: Schichten behalten

- Vorteile: Regeln ohne HTTP testbar, Speicherung austauschbar, wenn die Datenbank kommt
  (`project-rules/backend.md`, Abschnitt Data).
- Nachteile: Weiterleitungen ohne eigene Logik (`ItemService.findAll`), doppelte Tests.

### Option B: Resource mit Speicherung in einer Klasse, Tests nur über HTTP

- Vorteile: Entspricht A1.2, T1.1 und T1.3; weniger Code pro Feature.
- Nachteile: Umbau von 0001 und von `project-rules/backend.md`; der Datenbankwechsel trifft die
  Resource.

## Entscheidung

Option A, bis die Datenbank kommt. Die Trennung ist das Vorbereiten des Speicherwechsels aus
`project-rules/backend.md`. Ein Service-Test gilt nur für Regeln, die nicht an HTTP hängen;
reine Weiterleitung bekommt keinen eigenen Test.

## Folgen

- `project-rules/backend.md`, Abschnitt Structure, bleibt wie er ist.
- `ItemServiceTest.listsItemsInCreationOrder` wiederholt `ItemResourceTest` und wird beim
  nächsten Eingriff in `item/` entfernt.
- Mit dem Datenbank-ADR wird diese Entscheidung geprüft.
