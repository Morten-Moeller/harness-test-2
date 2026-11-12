# 0010: Artikel als Unterressource der Einkaufsliste, Contract 2.0.0

Status: accepted
Datum: 2026-11-12
Spec: docs/specs/0006-mehrere-einkaufslisten.md
Ersetzt Grundregeln: keine

## Kontext

Bis Spec 0005 kennt die API eine einzige, unbenannte Einkaufsliste: `/api/items`. Spec 0006 führt
mehrere benannte Einkaufslisten ein. Jeder Artikel gehört zu genau einer Liste; die Oberfläche
zeigt die Artikel je Liste. Der Contract in `contracts/openapi.yaml` hat die Version `1.0.0`,
einziger Konsument ist das Frontend in diesem Repository. Eine brechende Contract-Änderung ist
high risk und braucht ein ADR mit Migrationspfad (`harness/policies/adr.md`, Bedingungen 1 und
3; `contracts/README.md`). A2.6 verlangt eine Konvention für Filter auf Listenendpunkten.

## Optionen

### Option A: Artikel als Unterressource `/api/lists/{listId}/items`, Version 2.0.0

- Vorteile: Die Zugehörigkeit steht im Pfad; `Item` bleibt unverändert; kein Filterparameter und
  keine Regel für Artikel ohne Liste; eine unbekannte Liste ist 404 auf jedem Artikelendpunkt
  (A2.4). Backend und Frontend bleiben ein Feature je Seite.
- Nachteile: `/api/items` entfällt, der Contract bricht; jeder Artikelaufruf braucht die
  Listen-Id.

### Option B: `/api/items` bleibt, `Item` bekommt das Pflichtfeld `listId`, Filter `?listId=`

- Vorteile: Bestehende Pfade bleiben; ein Endpunkt für alle Artikel.
- Nachteile: Ebenfalls brechend (neues Pflichtfeld im Request, neues Feld in der Antwort);
  `GET /api/items` ohne Filter liefert Artikel aller Listen, die Oberfläche braucht ihn nicht;
  die erste Filterkonvention (A2.6) entsteht für einen Fall, den niemand nutzt.

### Option C: Version `1.0.0` behalten, alte Pfade parallel bedienen

- Vorteile: Kein Bruch.
- Nachteile: `/api/items` bräuchte eine Standardliste oder eine Sammelantwort; zwei Wege für
  dieselben Daten ohne zweiten Konsumenten; mehr Code und Tests ohne Nutzen.

## Entscheidung

Option A. Einkaufslisten liegen unter `/api/lists` (`GET`, `POST`, `PATCH /{id}`, `DELETE /{id}`),
Artikel unter `/api/lists/{listId}/items` (`GET`, `POST`, `PATCH /{id}`). `/api/items` entfällt.
`info.version` wird `2.0.0`. Migrationspfad: das Frontend ist der einzige Konsument und wird im
selben Pull Request umgestellt; es gibt keine Übergangszeit und keinen Parallelbetrieb. Die Form
der Änderungsendpunkte folgt ADR 0008 (`PATCH` mit Teilobjekt, 204). `DELETE /api/lists/{id}`
antwortet 204 und löscht die Artikel der Liste mit.

## Folgen

- `contracts/openapi.yaml`: Version `2.0.0`, Pfade und Schemas aus Spec 0006; `make contracts`
  erzeugt beide Dateien, `make drift` prüft sie.
- Backend: ein Feature-Paket `shoppinglist` für Listen und Artikel (`project-rules/backend.md`,
  A1.1); das Paket `item` geht darin auf.
- Frontend: ein Feature `shopping-lists` mit Seite und Tafel; das Feature `items` geht darin auf.
- Ein weiterer Konsument des Contracts wird in `contracts/README.md` eingetragen und bekommt ab
  dann bei brechenden Änderungen eine Übergangszeit; dieses ADR gilt nur für den Stand mit einem
  Konsumenten.
