---
id: "0004"
title: Artikel erledigen und Filter
status: done
risk: high
adrs: ["0008"]
owner: Morten Möller
created: 2026-11-11
---

# Artikel erledigen und Filter

## Ziel

Eine Person markiert einen Artikel auf ihrer Einkaufsliste als erledigt und öffnet ihn wieder,
ohne die Seite zu verlassen. Ein Umschalter blendet erledigte Artikel aus, damit beim Einkaufen
nur die offenen sichtbar sind. Gelöst ist das Problem, wenn jede Zeile der Liste eine Checkbox
hat, `PATCH /api/items/{id}` den Zustand speichert, der Zustand nach dem Neuladen der Seite
erhalten bleibt und der Umschalter `Nur offene anzeigen` die erledigten Artikel ausblendet.

## Scope

### Enthalten

- Backend: `PATCH /api/items/{id}` mit `{"done": true|false}` setzt den Zustand, antwortet 204
  (A2.4). Unbekannte Id: 404. Body ohne `done`: 400 (Quarkus-Standardbody, ADR 0003).
- Contract: neuer Endpunkt und Schema `UpdateItemRequest` in `contracts/openapi.yaml` und
  `frontend/src/app/shared/api.ts` über `make contracts`. Kompatible Änderung, Version bleibt
  `1.0.0`.
- Frontend: Checkbox pro Zeile mit dem Namen als Beschriftung; erledigte Artikel durchgestrichen.
  Nach jeder Änderung lädt die Komponente die Liste neu (ADR 0004). Fehler zeigt den Text
  `Der Artikel konnte nicht geändert werden.`.
- Frontend: Umschalter `Nur offene anzeigen` über der Liste, beim Laden aus; der Filter wirkt nur
  im Frontend auf der geladenen Liste.
- `project-rules/backend.md`: Regel für 404 ohne Widerspruch zu A3.5 (die Resource bildet
  "nicht gefunden" ab, der Service kennt kein HTTP).

### Nicht enthalten

- Speichern des Umschalters über das Neuladen hinaus.
- Filter im Backend (`GET /api/items?done=`); Entscheidung der Person.
- Löschen, Umbenennen, Menge ändern, Sortieren.
- Mehrere Einkaufslisten, Login.
- End-to-end-Tests: das Projekt hat die Ebene noch nicht; Bildschirm-Kriterien prüft `/verify`.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Artikel | `Item`, wie im Glossar. |
| erledigt | `done`, wie im Glossar: eingekauft, bleibt auf der Liste. Gegenteil hier: offen (`done: false`). |
| offen | Ein Artikel, der nicht erledigt ist. Neu, mit `/domain` ins Glossar. |

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | `PATCH /api/items/{id}` mit `{"done": true}` antwortet 204 ohne Body; `GET /api/items` zeigt den Artikel danach mit `done: true`, Name und Menge unverändert, Position in der Liste unverändert. `{"done": false}` setzt ihn zurück auf `done: false`. | Test `ItemResourceTest` |
| A2 | `PATCH /api/items/{id}` mit unbekannter Id antwortet 404. Mit Body ohne `done`, mit `done: null` oder ohne Body antwortet 400; `GET /api/items` zeigt danach keinen geänderten Artikel. | Test `ItemResourceTest` |
| A3 | Jede Zeile der Liste auf der Startseite hat eine Checkbox, deren Beschriftung der Name des Artikels ist; sie ist angehakt, wenn der Artikel erledigt ist, und per Tastatur erreichbar. Der Name eines erledigten Artikels ist durchgestrichen (Klasse `done`). | Test `items.spec.ts`; Bildschirm: Startseite |
| A4 | Klick auf die Checkbox eines offenen Artikels sendet `PATCH /api/items/{id}` mit `{"done": true}`, lädt die Liste neu und zeigt die Zeile erledigt; Klick auf die Checkbox eines erledigten Artikels sendet `{"done": false}`. Nach Neuladen der Seite bleibt der Zustand. | Test `items.spec.ts`; Bildschirm: Startseite |
| A5 | Antwortet das Backend auf `PATCH` mit einem Fehlerstatus, zeigt die Seite den Text `Der Artikel konnte nicht geändert werden.` und lädt die Liste neu; die Checkbox zeigt den gespeicherten Zustand. | Test `items.spec.ts` |
| A6 | Über der Liste steht der Umschalter `Nur offene anzeigen` als Checkbox, beim Laden nicht angehakt. Angehakt zeigt die Liste nur Artikel mit `done: false`; abgehakt wieder alle. Das Anhaken sendet keine Anfrage an das Backend. | Test `items.spec.ts`; Bildschirm: Startseite |
| A7 | Ist der Umschalter angehakt und alle Artikel sind erledigt, zeigt die Liste den Text `Keine offenen Artikel.`; gibt es keine Artikel, weiter `Noch keine Artikel.`. | Test `items.spec.ts` |
| A8 | `make contracts` erzeugt `PATCH /api/items/{id}` mit Schema `UpdateItemRequest {done: boolean, Pflicht}` und den Antworten 204, 400, 404 in `contracts/openapi.yaml`, `info.version` bleibt `1.0.0`; `make drift` ergibt keinen Unterschied. | Aufruf |

## Contracts

`contracts/openapi.yaml`, Version `1.0.0` bleibt (kompatibel: neuer Endpunkt, neues Schema).
Konsument: das Frontend über `frontend/src/app/shared/api.ts`.

| Endpunkt | Request | Antwort |
|---|---|---|
| `PATCH /api/items/{id}` | `UpdateItemRequest {done: boolean (Pflicht)}` | 204 ohne Body; 400 bei fehlendem `done` (Quarkus-Standardbody); 404 bei unbekannter Id |

`GET /api/items` und `POST /api/items` bleiben unverändert. Entscheidung zur Form: ADR 0008.

## Risiko

Stufe: high
Begründung: `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts` ändern sich (Contract,
high nach `harness/policies/risk.md`); dazu Backend- und Frontend-Quellen (medium) und
`project-rules/backend.md`. Gates: `make check` mit `make drift` in CI; Reviews Code, Sicherheit
und Architektur; das Label `human-approved` nach der Durchsicht der Person merged (G2).
ADR nötig: ja, 0008 (Bedingung 1 high risk und Bedingung 3 neuer Contract-Teil): Zustandsänderungen
über `PATCH` mit Teilobjekt und Antwort 204.

## Umsetzung

Dateien:

- `backend/src/main/java/de/mmoller/einkaufsliste/item/UpdateItemRequest.java`: neu, Record
  `@NotNull Boolean done`.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemRepository.java`: ändern,
  `boolean setDone(UUID id, boolean done)` über `computeIfPresent` (eine atomare Änderung, A4.4;
  Reihenfolge der `LinkedHashMap` bleibt).
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemService.java`: ändern,
  `boolean setDone(UUID id, boolean done)`, reicht das Ergebnis durch (kein HTTP, A3.5).
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemResource.java`: ändern,
  `@PATCH @Path("{id}")` mit `@Valid UpdateItemRequest`, 204 über `Response.noContent()`,
  `NotFoundException` bei `false`; MicroProfile-OpenAPI-Annotationen für 204, 400, 404.
- `contracts/openapi.yaml`, `frontend/src/app/shared/api.ts`: generiert über `make contracts`.
- `frontend/src/app/items/items-api.ts`: ändern, `setDone(id, done): Observable<void>` mit
  `PATCH /api/items/{id}`, Typ `UpdateItemRequest` aus dem Contract.
- `frontend/src/app/items/items.ts`: ändern, `load()` für `GET` (auch nach `create` statt
  Anhängen von Hand, ADR 0004), `toggleDone(item)`, Signal `onlyOpen`, `computed`
  `visibleItems`, Fehlertext.
- `frontend/src/app/items/items.html`: ändern, Umschalter `Nur offene anzeigen` (Checkbox
  `id="only-open"` mit Label), pro Zeile `<label>` mit Checkbox und Name, Klasse `done`, Leertexte.
- `frontend/src/app/items/items.css`: ändern, durchgestrichener Name, Zeile mit Checkbox,
  Umschalter.
- `frontend/src/app/items/items.spec.ts`: ändern, Tests zu A3 bis A7; Builder `anItem()` bleibt.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemResourceTest.java`: ändern, Tests zu
  A1 und A2 mit eigenen Artikeln je Test (T3.1).
- `project-rules/backend.md`: ändern, Abschnitt Errors: "Nicht gefunden: der Service liefert
  `false` oder ein leeres Ergebnis, die Resource antwortet 404 (`NotFoundException`)".
- `docs/domain/glossary.md`: ändern, Zeile `offen` (mit `/domain`).
- `docs/adr/0008-zustandsaenderung-ueber-patch.md`: neu.

Schritte:

1. Backend: `UpdateItemRequest`, `ItemRepository.setDone`, `ItemService.setDone`,
   `ItemResource` mit `PATCH`; Tests A1 und A2 in `ItemResourceTest`.
2. `make contracts` (Skill `contract`), beide generierten Dateien im selben Commit; `make drift`.
3. Frontend: `items-api.ts`, `items.ts` mit `load()`, `toggleDone`, `onlyOpen`, `visibleItems`;
   `items.html`, `items.css`.
4. `items.spec.ts`: A3 bis A7; der bestehende Test zum Anlegen prüft nach dem `POST` das neue
   `GET`.
5. `project-rules/backend.md`, Glossar, ADR 0008.
6. `make check`; Browser-Kriterien A3, A4, A6 für `/verify`.

Testdaten: keine Zustände. `ItemResourceTest` legt je Test eigene Artikel über `POST` an;
`items.spec.ts` antwortet mit `HttpTestingController`. Browser-Check im Zustand `empty`, Artikel
über das Formular anlegen (der Zustand ist Teil des geprüften Ablaufs).

Tests:

| Kriterium | Test |
|---|---|
| A1 | `ItemResourceTest`: `marksItemAsDone`, `reopensItem` |
| A2 | `ItemResourceTest`: `answers404ForUnknownItem`, `rejectsUpdateWithoutDone` (ParameterizedTest: ohne Feld, `null`, leerer Body) |
| A3 | `items.spec.ts`: `renders a checkbox per item labelled with the name`, `strikes through done items`; Browser: Startseite |
| A4 | `items.spec.ts`: `marks an item as done and reloads the list`, `reopens a done item`; Browser: Startseite, Neuladen |
| A5 | `items.spec.ts`: `shows an error when the backend rejects the change` |
| A6 | `items.spec.ts`: `hides done items while only open is checked`, `sends no request when toggling the filter`; Browser: Startseite |
| A7 | `items.spec.ts`: `shows Keine offenen Artikel when the filter hides everything` |
| A8 | Aufruf: `make contracts && make drift`, `grep -n "patch" contracts/openapi.yaml` |

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Tabelle Entscheidungen in `docs/specs/README.md`.

## Verifikationsplan

- make check (darin `make drift`)
- betroffene Tests: `backend/src/test/java/de/mmoller/einkaufsliste/item/`,
  `frontend/src/app/items/*.spec.ts`
- Browser: Startseite http://localhost:4200 (oder 4201): Artikel anlegen, Checkbox anhaken,
  Seite neu laden, Umschalter `Nur offene anzeigen` an und aus, Checkbox wieder abhaken.
