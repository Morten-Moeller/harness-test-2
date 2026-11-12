---
id: "0006"
title: Mehrere Einkaufslisten mit Überschrift, nebeneinander oder untereinander
status: done
risk: high
adrs: ["0010"]
owner: Morten Möller
created: 2026-11-12
---

# Mehrere Einkaufslisten mit Überschrift, nebeneinander oder untereinander

## Ziel

Eine Person führt mehrere Einkaufslisten zugleich, zum Beispiel eine pro Geschäft, und sieht sie
auf einer Seite: jede mit ihrem Namen als Überschrift, ihrem Formular für neue Artikel, ihrem
Umschalter `Nur offene anzeigen` und ihren Artikeln. Ein Umschalter `Anordnung` stellt die Listen
nebeneinander oder untereinander. Gelöst ist das Problem, wenn eine Person Einkaufslisten anlegt,
umbenennt und löscht, Artikel in jeder Liste wie bisher anlegt und erledigt, und die Daten über
`/api/lists` und `/api/lists/{listId}/items` gespeichert sind.

## Scope

### Enthalten

- Backend: Ressource `ShoppingList` unter `/api/lists` mit `GET`, `POST`, `PATCH /{id}` (Name)
  und `DELETE /{id}` (löscht die Liste mit ihren Artikeln). Paket `shoppinglist`.
- Backend: Artikel wandern unter die Liste: `/api/lists/{listId}/items` mit `GET`, `POST` und
  `PATCH /{id}`. Eine unbekannte `listId` antwortet 404. Das Paket `item` geht im Paket
  `shoppinglist` auf (ein Feature, A1.1, `project-rules/backend.md`).
- Contract: brechende Änderung, `info.version` `2.0.0` (ADR 0010). `/api/items` entfällt.
- Frontend: Feature `shopping-lists` ersetzt `items`. Seite mit Formular `Neue Einkaufsliste`,
  Umschalter `Anordnung` (`Nebeneinander` oder `Untereinander`) und einer Tafel pro Liste.
  Die Tafel zeigt die Überschrift mit `Umbenennen` und `Löschen`, das Formular für Artikel, den
  Umschalter `Nur offene anzeigen` und die Artikel wie in Spec 0004.
- `project-rules/testing.md`, Tabelle Areas: neue Pfade. `docs/architecture/overview.md`: Pakete.

### Nicht enthalten

- Speichern der Anordnung oder der Filter über das Neuladen hinaus (Entscheidung 0004).
- Reihenfolge der Listen ändern, Artikel zwischen Listen verschieben, Artikel löschen.
- Eine Standardliste beim ersten Start; die Seite beginnt ohne Listen.
- Bestätigungsdialog vor dem Löschen: `Löschen` löscht sofort (Entscheidung der Person).
- Login, mehrere Personen.
- End-to-end-Tests: das Projekt hat die Ebene noch nicht; Bildschirm-Kriterien prüft `/verify`.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Einkaufsliste | `ShoppingList`, wie im Glossar: eine benannte Liste von Artikeln. Der Name ist die Überschrift der Tafel. |
| Artikel | `Item`, wie im Glossar; gehört zu genau einer Einkaufsliste. |
| erledigt, offen | wie im Glossar, unverändert. |
| Anordnung | Nur Oberfläche, kein Domänenbegriff: `Nebeneinander` (Spalten) oder `Untereinander` (eine Spalte). |

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | `POST /api/lists` mit `{"name": "Rewe"}` antwortet 201 mit `{id, name}` und `Location`; der Name ist getrimmt. `GET /api/lists` zeigt die Listen in Reihenfolge des Anlegens. Leerer, fehlender oder über 100 Zeichen langer Name: 400, keine Liste gespeichert. | Test `ShoppingListResourceTest` |
| A2 | `PATCH /api/lists/{id}` mit `{"name": "Edeka"}` antwortet 204; `GET /api/lists` zeigt den neuen Namen, Id und Position unverändert. Unbekannte Id: 404. Leerer oder fehlender Name: 400, Name unverändert. | Test `ShoppingListResourceTest` |
| A3 | `DELETE /api/lists/{id}` antwortet 204; `GET /api/lists` zeigt die Liste nicht mehr, `GET /api/lists/{id}/items` antwortet 404. Unbekannte Id: 404. Andere Listen und ihre Artikel bleiben. | Test `ShoppingListResourceTest` |
| A4 | `GET`, `POST` und `PATCH` unter `/api/lists/{listId}/items` verhalten sich wie `/api/items` in Spec 0001 und 0004, je Liste getrennt: ein Artikel erscheint nur in seiner Liste. Unbekannte `listId`, oder eine Artikel-Id einer anderen Liste beim `PATCH`: 404. `/api/items` antwortet 404. | Test `ItemResourceTest` |
| A5 | Die Startseite zeigt oben das Formular `Neue Einkaufsliste` mit dem Feld `Name` und dem Button `Anlegen`; der Button ist gesperrt, solange der Name leer ist. Anlegen sendet `POST /api/lists`, lädt die Listen neu, leert das Feld und zeigt die neue Tafel mit dem Namen als Überschrift. Fehler: Text `Die Einkaufsliste konnte nicht angelegt werden.`. | Test `shopping-lists.spec.ts`; Bildschirm: Startseite |
| A6 | Ohne Einkaufslisten zeigt die Seite den Text `Noch keine Einkaufslisten.`. Kann `GET /api/lists` nicht geladen werden, zeigt sie `Die Einkaufslisten konnten nicht geladen werden.`. | Test `shopping-lists.spec.ts` |
| A7 | Der Umschalter `Anordnung` steht über den Tafeln als Radiogruppe `Nebeneinander` und `Untereinander`, beim Laden `Nebeneinander`. `Nebeneinander` setzt auf dem Container die Klasse `columns`, `Untereinander` entfernt sie; der Container zeigt die Tafeln mit `columns` in Spalten (Grid), sonst in einer Spalte. Das Umschalten sendet keine Anfrage. | Test `shopping-lists.spec.ts`; Bildschirm: Startseite |
| A8 | Jede Tafel hat die Überschrift (`h2`) mit dem Namen der Liste und daneben die Buttons `Umbenennen` und `Löschen`. `Umbenennen` ersetzt die Überschrift durch ein Feld mit dem Namen und die Buttons `Speichern` und `Abbrechen`. `Speichern` sendet `PATCH /api/lists/{id}` mit dem getrimmten Namen, lädt die Listen neu und zeigt die Überschrift; `Abbrechen` zeigt die alte Überschrift ohne Anfrage. Fehler: Text `Die Einkaufsliste konnte nicht umbenannt werden.`. | Test `shopping-lists.spec.ts`; Bildschirm: Startseite |
| A9 | `Löschen` sendet sofort und ohne Dialog `DELETE /api/lists/{id}`, lädt die Listen neu; die Tafel ist weg, die anderen bleiben. Fehler: Text `Die Einkaufsliste konnte nicht gelöscht werden.`. | Test `shopping-lists.spec.ts`; Bildschirm: Startseite |
| A10 | Jede Tafel hat ihr eigenes Formular `Name`, `Menge`, `Hinzufügen`, ihren Umschalter `Nur offene anzeigen` und ihre Artikel mit Checkbox, mit dem Verhalten aus Spec 0001 und 0004, gegen `/api/lists/{listId}/items`. Ein Artikel erscheint nur in der Tafel seiner Liste; der Filter einer Tafel wirkt nur auf diese Tafel. | Test `shopping-list.spec.ts`; Bildschirm: Startseite mit zwei Listen |
| A11 | `make contracts` erzeugt `contracts/openapi.yaml` mit `info.version` `2.0.0`, den Pfaden `/api/lists`, `/api/lists/{id}`, `/api/lists/{listId}/items`, `/api/lists/{listId}/items/{id}`, den Schemas `ShoppingList`, `CreateShoppingListRequest`, `UpdateShoppingListRequest` und ohne `/api/items`; `make drift` ergibt keinen Unterschied. | Aufruf |

## Contracts

`contracts/openapi.yaml`, Version `1.0.0` → `2.0.0` (brechend: `/api/items` entfällt, Artikel
liegen unter der Liste). Konsument: nur das Frontend in diesem Repository; es wird im selben PR
umgestellt (Migrationspfad in ADR 0010).

| Endpunkt | Request | Antwort |
|---|---|---|
| `GET /api/lists` | – | 200 `ShoppingList[]` in Reihenfolge des Anlegens |
| `POST /api/lists` | `CreateShoppingListRequest {name: string, Pflicht, 1 bis 100 Zeichen nach Trim}` | 201 `ShoppingList` mit `Location`; 400 |
| `PATCH /api/lists/{id}` | `UpdateShoppingListRequest {name: string, Pflicht, 1 bis 100 Zeichen nach Trim}` | 204; 400; 404 |
| `DELETE /api/lists/{id}` | – | 204; 404 |
| `GET /api/lists/{listId}/items` | – | 200 `Item[]`; 404 unbekannte Liste |
| `POST /api/lists/{listId}/items` | `CreateItemRequest` wie bisher | 201 `Item` mit `Location`; 400; 404 unbekannte Liste |
| `PATCH /api/lists/{listId}/items/{id}` | `UpdateItemRequest` wie bisher | 204; 400; 404 unbekannte Liste oder Artikel |

Schema `ShoppingList {id: UUID, name: string}`, beide Pflicht. `Item` bleibt unverändert; die
Liste steht im Pfad, nicht im Artikel. Fehlerbody: Quarkus-Standard (ADR 0003).

## Risiko

Stufe: high
Begründung: `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts` ändern sich brechend
(Contract, high nach `harness/policies/risk.md`); dazu Backend- und Frontend-Quellen (medium),
`project-rules/testing.md` und `docs/`. Gates: `make check` mit `make drift` in CI; Reviews Code,
Sicherheit und Architektur; `verify` vor dem Merge (G3, Status `verified`); das Label
`human-approved` nach der Durchsicht der Person merged (G2).
ADR nötig: ja, 0010 (Bedingung 1 high risk, Bedingung 3 brechender Contract): Artikel als
Unterressource der Einkaufsliste, Version 2.0.0, Migrationspfad für das Frontend.

## Umsetzung

Dateien:

- `backend/src/main/java/de/mmoller/einkaufsliste/shoppinglist/ShoppingList.java`: neu, Record
  `(UUID id, String name)` mit `@Schema(requiredProperties = {"id", "name"})`.
- `.../shoppinglist/CreateShoppingListRequest.java`: neu, Record `@NotBlank @Size(max = 100)
  String name`, Trim im Konstruktor wie `CreateItemRequest`.
- `.../shoppinglist/UpdateShoppingListRequest.java`: neu, gleiches Feld `name`.
- `.../shoppinglist/ShoppingListRepository.java`: neu, `synchronizedMap(LinkedHashMap)`; `save`,
  `findAll`, `exists(UUID)`, `rename(UUID, String)` über `computeIfPresent` (A4.4),
  `delete(UUID)`.
- `.../shoppinglist/ShoppingListService.java`: neu, `create`, `findAll`, `rename` → `boolean`,
  `delete` → `boolean`; `delete` ruft `ItemRepository.deleteAll(listId)` (A1.4, ein Feature).
- `.../shoppinglist/ShoppingListResource.java`: neu, `@Path("/api/lists")`, `GET`, `POST` (201,
  `Location`), `PATCH {id}` (204, 400, 404), `DELETE {id}` (204, 404) mit
  MicroProfile-OpenAPI-Annotationen.
- `.../item/Item.java`, `CreateItemRequest.java`, `UpdateItemRequest.java`, `ItemRepository.java`,
  `ItemService.java`, `ItemResource.java`: verschieben nach `.../shoppinglist/` (`git mv`, neue
  `package`-Zeile). `Item` bleibt ohne `listId`.
- `.../shoppinglist/ItemRepository.java`: ändern, `Map<UUID, Map<UUID, Item>>` je Liste;
  `save(listId, item)`, `setDone(listId, id, done)`, `findAll(listId)` → `Optional<List<Item>>`
  (leer bei unbekannter Liste), `deleteAll(listId)`.
- `.../shoppinglist/ItemService.java`: ändern, jede Methode mit `listId`; `create` → `Optional<Item>`
  (leer bei unbekannter Liste, Prüfung über `ShoppingListRepository.exists`), `findAll` →
  `Optional<List<Item>>`, `setDone` → `boolean`.
- `.../shoppinglist/ItemResource.java`: ändern, `@Path("/api/lists/{listId}/items")`,
  `@PathParam("listId") UUID listId`; leeres `Optional` oder `false` → `NotFoundException`.
- `backend/src/main/resources/application.properties`: ändern,
  `quarkus.smallrye-openapi.info-version=2.0.0`.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/*`: verschieben nach
  `.../shoppinglist/`; `ItemResourceTest` legt je Test eine eigene Liste an und nutzt die neuen
  Pfade; neue Fälle zu A4. `ItemServiceTest` mit `listId`.
- `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/ShoppingListResourceTest.java`:
  neu, Tests zu A1 bis A3.
- `contracts/openapi.yaml`, `frontend/src/app/shared/api.ts`: generiert über `make contracts`.
- `frontend/src/app/items/*`: verschieben nach `frontend/src/app/shopping-lists/` (`git mv`):
  `items.ts|html|css|spec.ts` → `shopping-list.ts|html|css|spec.ts` (Tafel), `items-api.ts` →
  `shopping-lists-api.ts`.
- `frontend/src/app/shopping-lists/shopping-lists-api.ts`: ändern, Klasse `ShoppingListsApi` mit
  `findAllLists`, `createList`, `renameList`, `deleteList`, `findAllItems(listId)`,
  `createItem(listId, request)`, `setDone(listId, id, request)`; Typen aus dem Contract.
- `frontend/src/app/shopping-lists/shopping-list.ts|html|css`: ändern, Komponente `ShoppingList`
  (Selektor `app-shopping-list`) mit `input.required<ShoppingList>()` `list`, Überschrift `h2`,
  Umbenennen (Signal `editing`, Feld, `Speichern`, `Abbrechen`), `Löschen`, `output` `changed`
  für die Seite (Listen neu laden); Formular, Filter und Artikel wie bisher gegen die neuen
  Pfade. Ids der Felder mit der Listen-Id als Suffix (`item-name-{{ list().id }}`), damit Labels
  bei mehreren Tafeln eindeutig bleiben.
- `frontend/src/app/shopping-lists/shopping-lists.ts|html|css`: neu, Seite `ShoppingLists`
  (Selektor `app-shopping-lists`): `load()` für `GET /api/lists`, Formular `Neue Einkaufsliste`
  (Feld `list-name`, Button `Anlegen`), Radiogruppe `Anordnung` (`layout-columns`,
  `layout-rows`, Signal `layout`, beim Laden `columns`), Container `.lists` mit Klasse `columns`, Grid mit
  `grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr))`, eine `app-shopping-list` pro
  Liste, Leertext, Fehlertext.
- `frontend/src/app/shopping-lists/shopping-lists.spec.ts`: neu, Tests zu A5 bis A9.
- `frontend/src/app/shopping-lists/shopping-list.spec.ts`: ändern, bestehende Fälle mit `list`
  als Input und neuen Pfaden; Fall zu A10 (Filter und Artikel je Tafel).
- `frontend/src/app/app.routes.ts`: ändern, `ShoppingLists` statt `Items`.
- `frontend/src/app/app.css`: ändern, `max-width` auf `72rem`, damit Spalten Platz haben.
- `project-rules/testing.md`: ändern, Tabelle Areas: `frontend/src/app/shopping-lists/`,
  `backend/src/main/java/de/mmoller/einkaufsliste/shoppinglist/`.
- `docs/architecture/overview.md`: ändern, Modulgrenzen: ein Feature-Paket `shoppinglist` mit
  Listen und Artikeln; Frontend-Feature `shopping-lists`.
- `docs/adr/0010-artikel-unter-einkaufsliste-contract-2.md`: neu. `docs/adr/README.md`: Zeile.

Schritte:

1. Backend: Paket `item` nach `shoppinglist` verschieben, `ShoppingList`-Klassen anlegen,
   `ItemRepository`, `ItemService`, `ItemResource` auf `listId` umstellen, Version `2.0.0`.
2. Backend-Tests: `ShoppingListResourceTest` (A1 bis A3), `ItemResourceTest` (A4) und
   `ItemServiceTest` anpassen.
3. `make contracts` (Skill `contract`), beide generierten Dateien im selben Commit; `make drift`.
4. Frontend: Feature-Ordner verschieben, `shopping-lists-api.ts`, Tafel `ShoppingList`, Seite
   `ShoppingLists`, Route, `app.css`.
5. Frontend-Tests: `shopping-lists.spec.ts` (A5 bis A9), `shopping-list.spec.ts` (A10).
6. `project-rules/testing.md`, `overview.md`, ADR 0010.
7. `make check`; Browser-Kriterien A5, A7, A8, A9, A10 für `/verify`.

Testdaten: keine Zustände. Die Backend-Tests legen je Test eigene Listen und Artikel über `POST`
an (T3.1); die Frontend-Tests antworten mit `HttpTestingController`. Browser-Check im Zustand
`empty`: zwei Listen und Artikel über die Formulare anlegen (der Zustand ist Teil des geprüften
Ablaufs).

Tests:

| Kriterium | Test |
|---|---|
| A1 | `ShoppingListResourceTest`: `createsListWithTrimmedName`, `listsListsInCreationOrder`, `rejectsInvalidListName` (ParameterizedTest: leer, blank, fehlend, 101 Zeichen) |
| A2 | `ShoppingListResourceTest`: `renamesList`, `answers404WhenRenamingUnknownList`, `rejectsRenameWithoutName` (ParameterizedTest: fehlend, blank, kein Body) |
| A3 | `ShoppingListResourceTest`: `deletesListWithItems`, `answers404WhenDeletingUnknownList`, `keepsOtherListsOnDelete` |
| A4 | `ItemResourceTest`: bestehende Fälle unter `/api/lists/{listId}/items`; neu `keepsItemsPerList`, `answers404ForUnknownList` (GET, POST, PATCH), `answers404ForItemOfOtherList`, `answers404ForOldItemsPath` |
| A5 | `shopping-lists.spec.ts`: `renders the form for a new list`, `disables Anlegen while the name is blank`, `creates a list and shows its panel`, `shows an error when the list cannot be created`; Browser: Startseite |
| A6 | `shopping-lists.spec.ts`: `shows Noch keine Einkaufslisten`, `shows an error when the lists cannot be loaded` |
| A7 | `shopping-lists.spec.ts`: `switches the layout between columns and rows without a request`; Browser: Startseite, beide Anordnungen |
| A8 | `shopping-lists.spec.ts`: `renames a list`, `cancels renaming without a request`, `shows an error when renaming fails`; Browser: Startseite |
| A9 | `shopping-lists.spec.ts`: `deletes a list and keeps the others`, `shows an error when deleting fails`; Browser: Startseite |
| A10 | `shopping-list.spec.ts`: bestehende Fälle mit `list` als Input und Pfad `/api/lists/{id}/items`; Browser: Startseite mit zwei Listen, Artikel je Liste anlegen, erledigen, Filter je Tafel |
| A11 | Aufruf: `make contracts && make drift`, `grep -n -E "version|/api/" contracts/openapi.yaml` |

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Tabelle Entscheidungen in `docs/specs/README.md`.

## Verifikationsplan

- make check (darin `make drift`)
- betroffene Tests: `backend/src/test/java/de/mmoller/einkaufsliste/shoppinglist/`,
  `frontend/src/app/shopping-lists/*.spec.ts`, `frontend/src/app/app.spec.ts`
- Browser: Startseite http://localhost:4200 (oder 4201): zwei Einkaufslisten anlegen, Anordnung
  umschalten, eine Liste umbenennen, in beiden Listen Artikel anlegen und erledigen, Filter je
  Tafel, eine Liste löschen, Seite neu laden.
