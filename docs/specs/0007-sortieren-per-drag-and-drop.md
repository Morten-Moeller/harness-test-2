---
id: "0007"
title: Einkaufslisten und Artikel per Drag and Drop sortieren
status: approved
risk: high
adrs: ["0011", "0012"]
owner: Morten Möller
created: 2026-11-12
---

# Einkaufslisten und Artikel per Drag and Drop sortieren

## Ziel

Eine Person bringt ihre Einkaufslisten und die Artikel jeder Liste in die Reihenfolge, die ihr
beim Einkaufen hilft: mit der Maus oder dem Finger durch Ziehen, mit der Tastatur über die Buttons
`Nach oben` und `Nach unten`. Ein Artikel lässt sich auch in eine andere Einkaufsliste ziehen.
Gelöst ist das Problem, wenn die Reihenfolge nach dem Neuladen der Seite erhalten bleibt, weil das
Backend sie über das Feld `position` in `PATCH /api/lists/{id}` und
`PATCH /api/lists/{listId}/items/{id}` speichert.

## Scope

### Enthalten

- Backend: `UpdateShoppingListRequest` bekommt das optionale Feld `position`, `name` wird
  optional; `UpdateItemRequest` bekommt die optionalen Felder `position` und `listId`, `done`
  wird optional. Ein Teilobjekt ohne bekanntes Feld ist 400 (ADR 0011). `position` ist der
  0-basierte Index nach der Änderung; außerhalb von `0..Anzahl-1` (beim Verschieben in eine
  andere Liste `0..Anzahl`) ist 400. `listId` verschiebt den Artikel in die genannte Liste;
  unbekannte Ziel-Liste ist 404.
- Backend: Repositories halten die Reihenfolge in Listen statt `LinkedHashMap`; `GET` liefert sie.
- Contract: kompatible Erweiterung (Felder werden optional, neue optionale Felder), Version
  bleibt `2.0.0`.
- Frontend: `@angular/cdk` (`DragDropModule`, ADR 0012). Jede Tafel hat in der Überschrift einen
  Griff `Einkaufsliste ziehen` und die Buttons `Nach oben` und `Nach unten`; jede Artikelzeile
  hat einen Griff `Artikel ziehen` und dieselben Buttons. Die Buttons sind visuell versteckt und
  erscheinen bei Tastaturfokus (Entscheidung der Person). Tafeln werden im Container `.lists`
  gezogen, Artikel innerhalb ihrer Tafel und in andere Tafeln (verbundene Drop-Listen).
- Frontend: Sortieren bei aktivem Filter `Nur offene anzeigen`: die sichtbaren Artikel werden
  untereinander verschoben, erledigte Artikel behalten ihre Position relativ zu ihnen. Die
  Rechnung steht in einer reinen Funktion (`order.ts`).
- `project-rules/frontend.md`: `@angular/cdk` als einzige Komponentenbibliothek, nur
  `DragDropModule`.

### Nicht enthalten

- Speichern der Reihenfolge je Person oder Gerät; es gibt eine gemeinsame Reihenfolge.
- Mehrfachauswahl, Ziehen mehrerer Artikel, Ziehen von Listen in andere Fenster.
- Sortieren nach Name oder Zustand (automatische Sortierung).
- Bestätigung oder Rückgängig nach dem Verschieben.
- End-to-end-Tests: das Projekt hat die Ebene noch nicht; Ziehen prüft `/verify` im Browser, die
  Buttons prüfen Komponententests.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Einkaufsliste, Artikel, erledigt, offen | wie im Glossar, unverändert. |
| Position | Nur API und Oberfläche, kein Domänenbegriff: der 0-basierte Index eines Eintrags in der Reihenfolge seiner Liste. |
| Griff | Nur Oberfläche: das Element einer Zeile oder Tafel, an dem gezogen wird. |

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | `PATCH /api/lists/{id}` mit `{"position": n}` antwortet 204; `GET /api/lists` zeigt die Liste an Index `n`, die anderen in alter relativer Reihenfolge, Name unverändert. `{"name": "Neu"}` allein benennt weiter um; `{"name": "Neu", "position": 0}` tut beides. `{}`, `{"position": -1}`, `{"position": Anzahl}` und `{"name": ""}` antworten 400 ohne Änderung. Unbekannte Id: 404. | Test `ShoppingListResourceTest` |
| A2 | `PATCH /api/lists/{listId}/items/{id}` mit `{"position": n}` antwortet 204; `GET .../items` zeigt den Artikel an Index `n`, die anderen in alter relativer Reihenfolge, `done`, Name und Menge unverändert. `{"done": true}` allein wirkt weiter; `{"done": true, "position": 0}` tut beides. `{}`, `{"position": -1}` und `{"position": Anzahl}` antworten 400 ohne Änderung. | Test `ItemResourceTest` |
| A3 | `PATCH /api/lists/{listId}/items/{id}` mit `{"listId": "<andere>", "position": n}` antwortet 204; der Artikel fehlt danach in der alten Liste und steht in der anderen an Index `n` mit unverändertem `id`, Name, Menge und `done`. `listId` gleich der eigenen Liste sortiert nur. `listId` ohne `position` hängt den Artikel ans Ende der Ziel-Liste. Unbekannte Ziel-Liste: 404 ohne Änderung. `position` über der Anzahl der Ziel-Liste: 400 ohne Änderung. | Test `ItemResourceTest` |
| A4 | Jede Tafel hat in der Überschrift einen Griff mit dem Namen `Einkaufsliste ziehen` und die Buttons `Nach oben` und `Nach unten` (visuell versteckt, bei Tastaturfokus sichtbar); bei der ersten Tafel ist `Nach oben` gesperrt, bei der letzten `Nach unten`. Ein Klick sendet `PATCH /api/lists/{id}` mit der neuen `position` und lädt die Listen neu; die Tafel steht danach an der neuen Stelle, auch nach Neuladen der Seite. Ziehen einer Tafel an eine andere Stelle sendet dieselbe Anfrage. | Test `shopping-lists.spec.ts` (Buttons); Bildschirm: Startseite (Ziehen) |
| A5 | Jede Artikelzeile hat einen Griff `Artikel ziehen` und die Buttons `Nach oben` und `Nach unten` (visuell versteckt, bei Tastaturfokus sichtbar; erste und letzte sichtbare Zeile entsprechend gesperrt). Ein Klick sendet `PATCH /api/lists/{listId}/items/{id}` mit der neuen `position` und lädt die Artikel der Tafel neu; Ziehen innerhalb der Tafel sendet dieselbe Anfrage. Die Reihenfolge bleibt nach Neuladen der Seite. | Test `shopping-list.spec.ts` (Buttons); Bildschirm: Startseite (Ziehen) |
| A6 | Ziehen einer Artikelzeile in eine andere Tafel sendet `PATCH /api/lists/{alt}/items/{id}` mit `listId` der Ziel-Liste und der `position` an der Ablagestelle; danach zeigt die Ziel-Tafel den Artikel an dieser Stelle und die alte Tafel nicht mehr, auch nach Neuladen. | Test `shopping-lists.spec.ts` (Ereignis `moved` lädt beide Tafeln); Bildschirm: Startseite |
| A7 | Bei aktivem Filter `Nur offene anzeigen` verschieben Griff und Buttons einen offenen Artikel nur relativ zu den anderen offenen Artikeln; die `position` in der Anfrage ist der Index in der vollständigen Liste, erledigte Artikel behalten ihre Position relativ zu den offenen. | Test `order.spec.ts` (tabellarisch), `shopping-list.spec.ts` |
| A8 | Schlägt `PATCH` fehl, zeigt die Tafel `Der Artikel konnte nicht verschoben werden.` beziehungsweise die Seite `Die Einkaufsliste konnte nicht verschoben werden.` und lädt neu; die alte Reihenfolge ist wieder sichtbar. | Test `shopping-list.spec.ts`, `shopping-lists.spec.ts` |
| A9 | `make contracts` erzeugt `UpdateShoppingListRequest {name?, position?}` und `UpdateItemRequest {done?, position?, listId?}` ohne Pflichtfelder in `contracts/openapi.yaml`, `info.version` bleibt `2.0.0`; `make drift` ergibt keinen Unterschied. | Aufruf |

## Contracts

`contracts/openapi.yaml`, Version `2.0.0` bleibt (kompatibel: Pflichtfelder werden optional,
neue optionale Felder). Konsument: das Frontend in diesem Repository.

| Endpunkt | Request | Antwort |
|---|---|---|
| `PATCH /api/lists/{id}` | `UpdateShoppingListRequest {name?: string (1 bis 100 Zeichen nach Trim), position?: integer ≥ 0}`, mindestens ein Feld | 204; 400 ohne Feld, bei leerem Namen oder `position` außerhalb `0..Anzahl-1`; 404 |
| `PATCH /api/lists/{listId}/items/{id}` | `UpdateItemRequest {done?: boolean, position?: integer ≥ 0, listId?: UUID}`, mindestens ein Feld | 204; 400 ohne Feld oder `position` außerhalb des Bereichs der Ziel-Liste; 404 bei unbekannter Liste, unbekanntem Artikel oder unbekannter Ziel-Liste |

Alle anderen Endpunkte bleiben unverändert; `GET` liefert die gespeicherte Reihenfolge.
Entscheidung: ADR 0011.

## Risiko

Stufe: high
Begründung: `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts` ändern sich (Contract,
high nach `harness/policies/risk.md`); neue Abhängigkeit `@angular/cdk` in `frontend/package.json`
und `pnpm-lock.yaml` (Manifest, mindestens medium); Backend- und Frontend-Quellen (medium).
Gates: `make check` mit `make drift` und `make deps` in CI; Reviews Code, Sicherheit und
Architektur; `verify` vor dem Merge (G3, Status `verified`); das Label `human-approved` nach der
Durchsicht der Person merged (G2).
ADR nötig: ja, 0011 (Bedingung 1 high risk: Form der Sortierung im Contract, erweitert ADR 0008)
und 0012 (Bedingung 2: neue Abhängigkeit `@angular/cdk`).

## Umsetzung

Dateien:

- `backend/src/main/java/de/mmoller/einkaufsliste/shoppinglist/UpdateShoppingListRequest.java`:
  ändern, `@Size(max = 100) String name` (null erlaubt, Trim, leer nach Trim bleibt leer und ist
  400 über eine Prüfung im Service), `@PositiveOrZero Integer position`; Methode `boolean
  isEmpty()` über `@AssertTrue`-Feld `hasField` oder eine Prüfung in der Resource (400).
- `.../shoppinglist/UpdateItemRequest.java`: ändern, `Boolean done`, `@PositiveOrZero Integer
  position`, `UUID listId`, gleiche Leerprüfung.
- `.../shoppinglist/ShoppingListRepository.java`: ändern, `List<ShoppingList>` mit
  `synchronized`-Methoden; `save`, `findAll`, `exists`, `update(id, name, position)` →
  `UpdateResult` (`OK`, `NOT_FOUND`, `INVALID_POSITION`), `delete`.
- `.../shoppinglist/ShoppingListService.java`: ändern, `update(id, request)` → `UpdateResult`;
  leerer Name nach Trim → `INVALID` (400).
- `.../shoppinglist/ShoppingListResource.java`: ändern, `PATCH` ruft `update`; `NOT_FOUND` →
  404, `INVALID_POSITION`/`INVALID` → 400 (`BadRequestException`).
- `.../shoppinglist/ItemRepository.java`: ändern, `Map<UUID, List<Item>>` je Liste mit einer
  Sperre pro Repository (`synchronized`); `save`, `findAll`, `update(listId, id, done, position,
  targetListId)` → `UpdateResult` (verschiebt atomar zwischen zwei Listen, A4.4), `deleteAll`.
- `.../shoppinglist/ItemService.java`: ändern, `update(listId, id, request)` → `UpdateResult`;
  `setDone` entfällt.
- `.../shoppinglist/ItemResource.java`: ändern, `PATCH` ruft `update`; Abbildung wie oben.
- `.../shoppinglist/UpdateResult.java`: neu, Enum `OK`, `NOT_FOUND`, `TARGET_NOT_FOUND`,
  `INVALID_POSITION`, `INVALID`.
- `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/ShoppingListResourceTest.java`:
  ändern, Tests zu A1.
- `.../shoppinglist/ItemResourceTest.java`: ändern, Tests zu A2 und A3; `rejectsUpdateWithoutDone`
  wird `rejectsUpdateWithoutField`.
- `contracts/openapi.yaml`, `frontend/src/app/shared/api.ts`: generiert über `make contracts`.
- `frontend/package.json`, `frontend/pnpm-lock.yaml`: `@angular/cdk` in der Hauptversion von
  `@angular/core` (`pnpm add @angular/cdk@22`).
- `frontend/src/app/shopping-lists/shopping-lists-api.ts`: ändern, `updateList(id, request)`
  ersetzt `renameList`, `updateItem(listId, id, request)` ersetzt `setDone`.
- `frontend/src/app/shopping-lists/order.ts`: neu, reine Funktionen `positionAfterMove(all,
  visible, fromVisible, toVisible)` (Index in `all`, an dem der Eintrag nach dem Verschieben
  steht, erledigte Einträge behalten ihre relative Lage) und `moveInArray`.
- `frontend/src/app/shopping-lists/order.spec.ts`: neu, tabellarisch (A7).
- `frontend/src/app/shopping-lists/shopping-list.ts|html|css`: ändern, `CdkDropList`, `CdkDrag`,
  `CdkDragHandle` aus `@angular/cdk/drag-drop`; `cdkDropListData` = `list()`, Griff pro Zeile
  (`button` mit `aria-label="Artikel ziehen"`, `cdkDragHandle`), Buttons `Nach oben` und
  `Nach unten` pro Zeile (`aria-label` mit Artikelname, Klasse `move` visuell versteckt bis
  `:focus-visible`), `dropped(event)` unterscheidet gleiche
  und fremde Quelle, `moveItem(item, toVisible)`, `output` `moved` mit der Quell-Listen-Id,
  Methode `reload()`; Fehlertext `Der Artikel konnte nicht verschoben werden.`.
- `frontend/src/app/shopping-lists/shopping-lists.ts|html|css`: ändern, `CdkDropListGroup` auf
  dem Container, `CdkDropList` mit `cdkDropListOrientation="mixed"` auf `.lists`, jede Tafel ein
  `cdkDrag` mit Griff `Einkaufsliste ziehen` und Buttons `Nach oben` und `Nach unten`;
  `moveList(list, to)`, `dropped(event)`; `viewChildren(ShoppingListPanel)` und `onMoved(sourceId)`
  lädt die Quell-Tafel neu; Fehlertext `Die Einkaufsliste konnte nicht verschoben werden.`.
- `frontend/src/app/shopping-lists/shopping-lists.spec.ts`, `shopping-list.spec.ts`: ändern,
  Tests zu A4, A5, A6 (Buttons und `moved`), A8.
- `project-rules/frontend.md`: ändern, Abschnitt UI: `@angular/cdk` nur `DragDropModule`.
- `docs/adr/0011-sortierung-ueber-position-in-patch.md`, `docs/adr/0012-angular-cdk-fuer-drag-and-drop.md`:
  neu. `docs/adr/README.md`: Zeilen.

Schritte:

1. Backend: `UpdateResult`, Request-Typen, Repositories auf Listen, Services, Resources.
2. Backend-Tests: A1 bis A3 in `ShoppingListResourceTest` und `ItemResourceTest`.
3. `make contracts` (Skill `contract`), beide generierten Dateien im selben Commit; `make drift`.
4. `pnpm add @angular/cdk@22` in `frontend/`; `make deps`.
5. Frontend: `order.ts` mit Tests, API-Klasse, Tafel, Seite, Styles für Griff und Buttons.
6. Frontend-Tests: A4 bis A8.
7. `project-rules/frontend.md`, ADR 0011 und 0012.
8. `make check`; Browser-Kriterien A4, A5, A6 (Ziehen) für `/verify`.

Testdaten: keine Zustände. Backend-Tests legen je Test eigene Listen und Artikel über `POST` an
(T3.1); Frontend-Tests antworten mit `HttpTestingController`. Browser-Check im Zustand `empty`:
zwei Listen mit je drei Artikeln über die Formulare anlegen.

Tests:

| Kriterium | Test |
|---|---|
| A1 | `ShoppingListResourceTest`: `movesListToPosition`, `renamesAndMovesList`, `rejectsInvalidListUpdate` (ParameterizedTest: `{}`, `position -1`, `position Anzahl`, leerer Name), `answers404WhenMovingUnknownList` |
| A2 | `ItemResourceTest`: `movesItemToPosition`, `marksDoneAndMovesItem`, `rejectsUpdateWithoutField` (ParameterizedTest: `{}`, `position -1`, `position Anzahl`, kein Body) |
| A3 | `ItemResourceTest`: `movesItemToOtherList`, `movesItemToEndOfOtherListWithoutPosition`, `answers404ForUnknownTargetList`, `rejectsPositionBeyondTargetList` |
| A4 | `shopping-lists.spec.ts`: `renders handle and move buttons per panel`, `moves a list down with the button`, `disables Nach oben on the first panel`; Browser: Tafel ziehen |
| A5 | `shopping-list.spec.ts`: `renders handle and move buttons per item`, `moves an item up with the button`; Browser: Zeile ziehen |
| A6 | `shopping-lists.spec.ts`: `reloads the source panel after moved`; Browser: Zeile in andere Tafel ziehen, Neuladen |
| A7 | `order.spec.ts`: Tabelle mit sichtbaren und erledigten Einträgen; `shopping-list.spec.ts`: `moves only among open items while the filter is on` |
| A8 | `shopping-list.spec.ts`: `shows an error when moving fails`; `shopping-lists.spec.ts`: `shows an error when moving a list fails` |
| A9 | Aufruf: `make contracts && make drift`, `grep -n -A6 "UpdateItemRequest:" contracts/openapi.yaml` |

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Tabelle Entscheidungen in `docs/specs/README.md`.

## Verifikationsplan

- make check (darin `make drift`, `make deps`)
- betroffene Tests: `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/`,
  `frontend/src/app/shopping-lists/*.spec.ts`
- Browser: Startseite http://localhost:4200 (oder 4201): zwei Listen mit je drei Artikeln anlegen,
  Tafel ziehen, Artikel in der Tafel ziehen, Artikel in die andere Tafel ziehen, Buttons `Nach
  oben` und `Nach unten`, Filter an und Artikel verschieben, Seite neu laden.
