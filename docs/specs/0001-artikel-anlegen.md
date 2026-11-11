---
id: "0001"
title: Artikel anlegen
status: done
risk: high
adrs: ["0001"]
owner: Morten Möller
created: 2026-11-10
---

# Artikel anlegen

## Ziel

Eine Person legt auf ihrer Einkaufsliste einen Artikel mit Name und optionaler Menge an und sieht
ihn sofort in der Liste. Die Anwendung hat in dieser Spec genau eine Einkaufsliste; sie wird nicht
als eigenes Objekt gespeichert. Gelöst ist das Problem, wenn die Startseite ein Formular zeigt, ein
abgeschickter Artikel über `POST /api/items` gespeichert wird und nach dem Neuladen der Seite noch
in der Liste steht.

Diese Spec ist die erste API-Spec. Sie entscheidet mit ADR 0001, wie der Contract nach
`contracts/` kommt: code-first aus den Quarkus-Annotationen, Frontend-Typen daraus generiert.

## Scope

### Enthalten

- Backend: `POST /api/items` legt einen Artikel an, `GET /api/items` liefert alle Artikel in
  Anlagereihenfolge. Speicherung im Arbeitsspeicher.
- Validierung: Name Pflicht, 1 bis 100 Zeichen nach Trim; Menge optional, höchstens 50 Zeichen
  nach Trim; leere Menge wird `null`.
- Frontend: Startseite mit Formular (Felder `Name`, `Menge`, Button `Hinzufügen`) und darunter die
  Artikel der Liste. Ein neuer Artikel erscheint ohne Neuladen.
- Contract: `contracts/openapi.yaml` aus dem Backend-Build, `frontend/src/app/shared/api.ts` aus
  dem Contract, beides über `make contracts`. `contracts/README.md` mit den Regeln.
- Dev-Proxy `/api` → `http://localhost:8080`.

### Nicht enthalten

- Mehrere Einkaufslisten, Anlegen oder Auswählen einer Einkaufsliste.
- Artikel als erledigt markieren, ändern oder löschen. `done` ist immer `false`.
- Dauerhafte Speicherung (Datenbank). Kommt mit eigener Spec und ADR.
- Prüfung auf doppelte Namen. Zwei Artikel mit gleichem Namen sind erlaubt (Entscheidung vom 2026-11-10).
- Sortierung, Suche, Paginierung.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Einkaufsliste | Die eine feste Liste der Anwendung. Kein eigenes Objekt im Code, kein Feld an `Item`. |
| Artikel | `Item`: `id` (UUID), `name`, `quantity`, `done`. |
| erledigt | `done`, beim Anlegen immer `false`. |
| Menge | Freitext zu einem Artikel, zum Beispiel `2 kg` oder `3 Stück`. Im Code `quantity`. Neu, mit /domain ins Glossar. |
| anlegen | Einen Artikel neu auf die Einkaufsliste setzen. Im Code `create`. Neu, mit /domain ins Glossar. |

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | `POST /api/items` mit `{"name":"Milch","quantity":"1 l"}` antwortet 201, Header `Location: /api/items/<id>`, Body `{id, name:"Milch", quantity:"1 l", done:false}`. Ohne `quantity` ist `quantity` im Body `null`. | Test `ItemResourceTest` |
| A2 | `POST /api/items` mit fehlendem, leerem oder nur aus Leerzeichen bestehendem `name`, mit `name` über 100 Zeichen oder `quantity` über 50 Zeichen antwortet 400; `GET /api/items` zeigt danach keinen neuen Artikel. | Test `ItemResourceTest` |
| A3 | `GET /api/items` antwortet 200 mit allen angelegten Artikeln in Anlagereihenfolge; vor dem ersten Anlegen mit `[]`. | Test `ItemResourceTest` |
| A4 | Name und Menge werden vor dem Speichern getrimmt (`"  Milch "` wird `"Milch"`); eine Menge aus Leerzeichen wird `null`. | Test `ItemServiceTest` |
| A5 | Die Startseite `http://localhost:4200` zeigt ein Formular mit den beschrifteten Feldern `Name` und `Menge` und dem Button `Hinzufügen`; beide Felder und der Button sind per Tastatur erreichbar. | Bildschirm: Startseite (`/verify` im Browser) |
| A6 | Der Button `Hinzufügen` ist deaktiviert, solange `Name` leer ist oder nur Leerzeichen enthält. | Test `items.spec.ts`; Bildschirm: Startseite |
| A7 | Nach Eingabe von Name und Menge und Klick auf `Hinzufügen` steht der Artikel mit Name und Menge in der Liste unter dem Formular, die Felder sind leer, der Fokus liegt auf `Name`. Nach Neuladen der Seite steht der Artikel weiterhin in der Liste. | Test `items.spec.ts`; Bildschirm: Startseite |
| A8 | Antwortet das Backend auf `POST /api/items` mit einem Fehlerstatus, zeigt die Seite den Text `Der Artikel konnte nicht angelegt werden.`; die Eingaben bleiben stehen. | Test `items.spec.ts` |
| A9 | `make contracts` erzeugt `contracts/openapi.yaml` mit `POST /api/items`, `GET /api/items`, den Schemas `Item` und `CreateItemRequest`, und `frontend/src/app/shared/api.ts` daraus. Auf dem fertigen Branch ergibt `make contracts && git diff --exit-code contracts frontend/src/app/shared/api.ts` keinen Unterschied. | Aufruf |

## Contracts

Neu: `contracts/openapi.yaml`, Version `1.0.0`, erzeugt aus dem Backend (ADR 0001). Konsument ist
das Frontend über die generierte Datei `frontend/src/app/shared/api.ts`. Keine Abwärtskompatibilität
zu prüfen, es gibt keinen Vorgänger.

Inhalt:

| Endpunkt | Request | Antwort |
|---|---|---|
| `POST /api/items` | `CreateItemRequest {name: string (Pflicht, 1..100), quantity?: string (0..50)}` | 201, `Location: /api/items/{id}`, Body `Item`; 400 bei Validierungsfehler (Quarkus-Standardbody) |
| `GET /api/items` | – | 200, Body `Item[]` in Anlagereihenfolge |

`Item {id: string (uuid), name: string, quantity: string | null, done: boolean}`.

Regeln für `contracts/README.md` (werden dort festgeschrieben): die Quelle des Contracts sind die
Java-Typen und Annotationen im Backend; `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts`
sind generiert und werden nie von Hand geändert; `make contracts` erzeugt beide; die Version steht
in `info.version` (`quarkus.smallrye-openapi.info-version`), kompatible Änderungen behalten sie,
brechende erhöhen die Hauptversion und brauchen ein ADR mit Migrationspfad.

## Risiko

Stufe: high
Begründung: `harness/scripts/risk-level.sh` über die Dateien unter `## Umsetzung`: `contracts/openapi.yaml`
und `contracts/README.md` treffen `contracts/**` (high). Feature-Code in `backend/src/main` und
`frontend/src` ist medium, ebenso `project-rules/backend.md`; `backend/pom.xml`, `frontend/package.json` und `frontend/pnpm-lock.yaml`
sind Dependency-Manifeste (mindestens medium, neue Abhängigkeiten `rest-assured` im Test-Scope und
`openapi-typescript` als Dev-Abhängigkeit). Höchste Stufe zählt.
Gates: G0 und G1 durch Freigabe in dieser Session. G2: Label `human-approved` durch die Person
nach dem letzten Push. G3: `/verify`-Ergebnis für den Head-Commit im PR-Body vor dem Label.
Reviews: Code, Security und Architektur (high und `contracts/`).
ADR nötig: ja, Nr. 0001. Gründe aus `harness/policies/adr.md`: high risk (1), neue Abhängigkeit
`openapi-typescript` (2), neuer Contract, von dem das Frontend abhängt (3), Entscheidung mit
Alternativen über Backend und Frontend hinweg (4).

## Umsetzung

Dateien:

- `backend/pom.xml`: ändern, Test-Abhängigkeit `io.rest-assured:rest-assured` (Version aus der Quarkus-BOM).
- `backend/src/main/resources/application.properties`: ändern, `quarkus.smallrye-openapi.store-schema-directory=../contracts`, `quarkus.smallrye-openapi.info-title=Einkaufsliste API`, `quarkus.smallrye-openapi.info-version=1.0.0`, `quarkus.smallrye-openapi.auto-add-server=false` (sonst schreibt der Testlauf `servers`-Einträge in den Contract und der Build-Lauf nicht; der Contract wäre nicht reproduzierbar).
- `backend/src/main/java/de/mmoller/einkaufsliste/item/Item.java`: neu, Record `Item(UUID id, String name, String quantity, boolean done)`.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/CreateItemRequest.java`: neu, Record mit `@NotBlank @Size(max = 100) String name`, `@Size(max = 50) String quantity`; der Konstruktor trimmt beide Werte und setzt eine leere Menge auf `null`, damit die Längenprüfung nach dem Trim gilt.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemRepository.java`: neu, `@ApplicationScoped`, Speicher im Arbeitsspeicher in Anlagereihenfolge (`Collections.synchronizedMap(new LinkedHashMap<>())`), `save`, `findAll`.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemService.java`: neu, `create(CreateItemRequest)` vergibt `UUID.randomUUID()`, `done=false`; `findAll()`.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemResource.java`: neu, `@Path("/api/items")`, `POST` mit `@Valid`, antwortet 201 mit `Location`; `GET` liefert die Liste.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemServiceTest.java`: neu, JUnit 5 ohne Quarkus-Start.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemResourceTest.java`: neu, `@QuarkusTest` mit RestAssured.
- `contracts/README.md`: neu, Regeln aus `## Contracts`.
- `project-rules/backend.md`: ändern, Abschnitt APIs: der offene Satz zu `contracts/` verweist auf ADR 0001 und `make contracts`.
- `contracts/openapi.yaml`: neu, generiert durch `make contracts`.
- `.gitignore`: ändern, `contracts/openapi.json` (Quarkus schreibt neben YAML auch JSON; nur YAML ist der Contract).
- `Makefile`: ändern, Ziel `contracts` (Backend-Build mit `-DskipTests package`, danach `openapi-typescript ../contracts/openapi.yaml -o src/app/shared/api.ts`, `eslint --fix` und `prettier --write` auf die erzeugte Datei; `openapi-typescript` hat keine Option für die Indexsignaturen, die `consistent-indexed-object-style` meldet, der Fix-Lauf ist Teil der Generator-Pipeline, die Lint-Konfiguration bleibt unverändert).
- `frontend/package.json`, `frontend/pnpm-lock.yaml`: ändern, Dev-Abhängigkeit `openapi-typescript`.
- `frontend/src/app/shared/api.ts`: neu, generiert durch `make contracts`, Kopfzeile des Generators (`auto-generated`).
- `frontend/proxy.conf.json`: neu, `/api` → `http://localhost:8080`.
- `frontend/angular.json`: ändern, `proxyConfig` im Ziel `serve`.
- `frontend/src/app/app.config.ts`: ändern, `provideHttpClient(withFetch())`.
- `frontend/src/app/app.routes.ts`: ändern, Route `''` auf die Komponente `Items`.
- `frontend/src/app/app.ts`, `app.html`, `app.css`: ändern, Platzhalter entfernen, Überschrift `Einkaufsliste` und `<router-outlet />`.
- `frontend/src/app/app.spec.ts`: ändern, Test auf die Überschrift statt `Hello, einkaufsliste`.
- `frontend/src/app/items/items-api.ts`: neu, Service `ItemsApi` mit `HttpClient`: `create(request)` → `POST /api/items`, `findAll()` → `GET /api/items`. Typen `Item` und `CreateItemRequest` als Aliase auf `components['schemas'][...]` aus `shared/api.ts`.
- `frontend/src/app/items/items.ts`, `items.html`, `items.css`: neu, Komponente `Items` (Selector `app-items`), Zustand in Signals (`name`, `quantity`, `items`, `error`), `computed` für den deaktivierten Button, Formular mit `<label for>`, Liste als `<ul>`.
- `frontend/src/app/items/items.spec.ts`: neu, Vitest mit `provideHttpClientTesting`.

Schritte:

1. ADR 0001 ist mit dieser Spec freigegeben; `contracts/README.md` nach `## Contracts` schreiben.
2. Backend: `pom.xml`, `application.properties`, die fünf Klassen im Paket `item`, dann
   `ItemServiceTest` und `ItemResourceTest`. `make backend-typecheck`, `make backend-test`.
3. `make contracts` ausführen; `contracts/openapi.yaml` prüfen (beide Endpunkte, beide Schemas,
   `quantity` nullable). `.gitignore` um `contracts/openapi.json` ergänzen.
4. Frontend: `openapi-typescript` als Dev-Abhängigkeit, `make contracts` erneut für
   `shared/api.ts`. Proxy, `app.config.ts`, Route, `app.*` aufräumen, Feature `items` mit Service,
   Komponente und Test.
5. `make check`. Lint-Fehler in `shared/api.ts` werden über die Generator-Optionen von
   `openapi-typescript` gelöst, nicht über die Lint-Konfiguration.
6. `make contracts && git diff --exit-code contracts frontend/src/app/shared/api.ts` (A9).

Tests:

| Kriterium | Test |
|---|---|
| A1 | `ItemResourceTest`: `createsItemWithQuantity`, `createsItemWithoutQuantity` |
| A2 | `ItemResourceTest`: `rejectsBlankName`, `rejectsTooLongName`, `rejectsTooLongQuantity`, jeweils mit anschließendem `GET`; `acceptsBoundaryLengthsAfterTrim` |
| A3 | `ItemResourceTest`: `listsItemsInCreationOrder`, `listsNothingAtStart` |
| A4 | `ItemServiceTest`: `trimsNameAndQuantity`, `storesBlankQuantityAsNull` |
| A5 | Browser: Startseite, Felder und Button sichtbar, Tab-Reihenfolge Name → Menge → Hinzufügen |
| A6 | `items.spec.ts`: `disables the button while the name is blank`; Browser: Startseite |
| A7 | `items.spec.ts`: `adds the created item to the list and clears the form`; Browser: Startseite, Artikel anlegen, Seite neu laden |
| A8 | `items.spec.ts`: `shows an error when the backend rejects the item` |
| A9 | Aufruf: `make contracts && git diff --exit-code contracts frontend/src/app/shared/api.ts` |

Contracts regenerieren: `make contracts`. Der Eintrag `contracts_generate_target: contracts` in
`harness/config.yml` ist für Agenten gesperrt; die Person setzt ihn vor `/implement` (Entscheidung vom 2026-11-10).

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Tabelle Entscheidungen in `docs/specs/README.md`.

## Verifikationsplan

- make check
- betroffene Tests: `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemServiceTest.java`,
  `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemResourceTest.java`,
  `frontend/src/app/items/items.spec.ts`, `frontend/src/app/app.spec.ts`
- Contract: `make contracts && git diff --exit-code contracts frontend/src/app/shared/api.ts`
- Browser: Startseite `http://localhost:4200` (A5, A6, A7) mit laufendem `make dev-backend` und `make dev-frontend`
