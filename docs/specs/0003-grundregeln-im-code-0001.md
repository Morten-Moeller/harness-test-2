---
id: "0003"
title: Grundregeln im Code von Feature 0001 umsetzen
status: approved
risk: medium
adrs: ["0006", "0007"]
owner: Morten Möller
created: 2026-11-11
---

# Grundregeln im Code von Feature 0001 umsetzen

## Ziel

Der Code von Feature 0001 hält die Grundregeln aus `harness/architecture.md` und
`harness/testing.md`, die kein ADR ablöst: Ids als UUIDv7 (A4.2), strukturierte Logs mit einer
Request-Id pro Anfrage (A6.4) und Tests ohne Reihenfolge, ohne Zählen fremder Zeilen und ohne
JSON-Strings (T3.1, T3.2, T3.4, T5.1, T5.3, T1.3). Gelöst ist das Problem, wenn die
Architekturprüfung keine dieser Abweichungen mehr meldet und die Anwendung sich für die Person im
Browser nicht ändert.

## Scope

### Enthalten

- Ids: `java-uuid-generator` (ADR 0006) erzeugt UUIDv7 in einem Plattform-Paket `ids`; der
  Service nutzt es statt `UUID.randomUUID()`.
- Request-Id: ein Filter übernimmt `X-Request-Id` aus der Anfrage (höchstens 64 Zeichen, nur
  Buchstaben, Ziffern und Bindestrich), erzeugt sonst eine UUIDv7, legt sie als `requestId` in
  den MDC und gibt sie im Antwort-Header `X-Request-Id` zurück. Pro Anfrage eine Logzeile mit
  Methode, Pfad ohne Query und Status.
- JSON-Logs: `quarkus-logging-json` (ADR 0007). JSON ohne Profil, Text in `dev` und `test`.
- `ItemResourceTest`: keine Testreihenfolge, eigene Artikel mit Zufallssuffix pro Test, Prüfung
  nur der eigenen Artikel, Request-Bodies über einen Builder.
- `ItemServiceTest`: der Weiterleitungstest `listsItemsInCreationOrder` entfällt (ADR 0002).
- `app.spec.ts`: der Test `should create the app` entfällt, der Überschriften-Test heißt nach
  dem Verhalten.

### Nicht enthalten

- Datenbank, Migrationen, `created_at` und `updated_at` (A4.1, A4.3): eigene Spec mit ADR.
- Fehlerform nach RFC 9457, Query-Cache, i18n, Design-Tokens: ADRs 0003 bis 0005 gelten.
- End-to-end-Tests und Testdaten-Kommando: eigene Spec.
- Tracing (OpenTelemetry): nicht geplant; die Request-Id ist nur Diagnose.
- Der Test der leeren Liste beim Start (`listsNothingAtStart`, Kriterium A3 aus 0001) entfällt
  ohne Ersatz; der Speicher ist in Tests gemeinsam.
- Contract: keine Änderung. Der Header `X-Request-Id` ist Diagnose und steht nicht im Contract.

## Begriffe

| Begriff | Bedeutung hier |
|---|---|
| Artikel | `Item`, wie im Glossar. |
| Request-Id | Technischer Begriff, kein Domänenbegriff: Kennung einer HTTP-Anfrage für Logs. |

## Akzeptanzkriterien

| Nr | Kriterium | Prüfung |
|---|---|---|
| A1 | `POST /api/items` vergibt Ids mit UUID-Version 7; zwei nacheinander angelegte Artikel haben als Zeichenkette aufsteigende Ids. | Test |
| A2 | Jede Antwort unter `/api` trägt den Header `X-Request-Id`. Ein gültiger Header aus der Anfrage wird unverändert zurückgegeben; ein ungültiger (länger als 64 Zeichen oder andere Zeichen) wird durch eine neue UUIDv7 ersetzt. | Test |
| A3 | Pro Anfrage schreibt das Backend eine Logzeile mit Methode, Pfad ohne Query und Status; die Request-Id steht im MDC-Feld `requestId`. Kein Body, keine Query-Parameter im Log. | Aufruf: `make dev-backend`, `curl -i localhost:8080/api/items?x=1`, Konsole |
| A4 | Ohne Profil schreibt das Backend Logzeilen als JSON mit `timestamp`, `level`, `message` und `mdc.requestId`; in `dev` und `test` bleibt das Textformat. | Aufruf: `cd backend && ./mvnw -DskipTests package && java -jar target/quarkus-app/quarkus-run.jar`, erste Zeile |
| A5 | `ItemResourceTest` läuft ohne `@Order` und in zufälliger Reihenfolge grün; jeder Test prüft nur Artikel, die er selbst angelegt hat. | Aufruf: `cd backend && ./mvnw test -Dtest=ItemResourceTest -Dsurefire.runOrder=random` |
| A6 | Request-Bodies in `ItemResourceTest` kommen aus einem Builder mit Vorgaben; kein JSON-String im Test. | Datei |
| A7 | `ItemServiceTest` hat keinen Test, der nur `repository.findAll()` weiterreicht; `app.spec.ts` hat keinen Test `should create the app`, und der Überschriften-Test heißt nach dem Verhalten. | Datei |

## Contracts

Keine. `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts` bleiben gleich; `make drift`
prüft es. Der Id-Typ bleibt `string, format uuid`.

## Risiko

Stufe: medium
Begründung: `backend/pom.xml` (Dependency-Manifest) und Backend-Quellen; kein Contract, keine
Policy, keine Workflows. Keine Eskalatoren. Gates: `make check` in CI; das Label
`human-approved` nach der Durchsicht der Person merged (G2).
ADR nötig: ja, 0006 (`java-uuid-generator`) und 0007 (`quarkus-logging-json`), Bedingung 2 in
`harness/policies/adr.md`: neue Abhängigkeiten.

## Umsetzung

Dateien:

- `backend/pom.xml`: ändern, `com.fasterxml.uuid:java-uuid-generator` (neueste 5.x) und
  `io.quarkus:quarkus-logging-json` (Version aus dem Quarkus-BOM).
- `backend/src/main/java/de/mmoller/einkaufsliste/ids/IdGenerator.java`: neu,
  `@ApplicationScoped`, `UUID next()` über `Generators.timeBasedEpochGenerator()`.
- `backend/src/main/java/de/mmoller/einkaufsliste/requestlog/RequestIdFilter.java`: neu,
  `@Provider` mit `ContainerRequestFilter` und `ContainerResponseFilter`: Header prüfen
  (`^[A-Za-z0-9-]{1,64}$`), sonst `IdGenerator`, `MDC.put("requestId", ...)`, Antwort-Header,
  Logzeile `"%s %s -> %d"` bei der Antwort, `MDC.remove`.
- `backend/src/main/java/de/mmoller/einkaufsliste/item/ItemService.java`: ändern, `IdGenerator`
  per Konstruktor, `ids.next()` statt `UUID.randomUUID()`.
- `backend/src/main/resources/application.properties`: ändern, JSON-Logs an, in `%dev` und
  `%test` aus; Log-Level unverändert.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemResourceTest.java`: ändern, siehe
  Schritte 5 und 6.
- `backend/src/test/java/de/mmoller/einkaufsliste/item/ItemServiceTest.java`: ändern,
  Weiterleitungstest entfernen, `IdGenerator` im Konstruktor.
- `backend/src/test/java/de/mmoller/einkaufsliste/requestlog/RequestIdFilterTest.java`: neu.
- `frontend/src/app/app.spec.ts`: ändern, Test entfernen und umbenennen.
- `docs/architecture/overview.md`: ändern, Zeile zu Logging (JSON, Request-Id) im Querschnitt.
- `project-rules/backend.md`: ändern, Abschnitt Errors, logging, configuration: JSON-Logs und
  Request-Id; Ids über `IdGenerator`.
- `project-rules/testing.md`: ändern, Tabelle Areas: Zeilen für
  `backend/src/main/java/de/mmoller/einkaufsliste/ids/` (Tests über `item/`, kein eigener Test,
  T1.3) und `backend/src/main/java/de/mmoller/einkaufsliste/requestlog/`.

Schritte:

1. Abhängigkeiten in `pom.xml`, `IdGenerator`, `ItemService` auf `IdGenerator`.
2. `RequestIdFilter` mit Logzeile, `application.properties`.
3. `RequestIdFilterTest`: Header gesetzt, Header übernommen, ungültiger Header ersetzt.
4. `ItemResourceTest`: `@TestMethodOrder` und `@Order` entfernen; Builder `anItem()` liefert
   eine `Map` für den Body mit Vorgaben (Name `Artikel-<Suffix>`, Menge `null`), der Test setzt
   nur die Werte, um die es geht (T3.4); pro Test ein Suffix aus `UUID.randomUUID()`;
   `listsItemsInCreationOrder` legt zwei Artikel an und prüft die Liste gefiltert nach dem
   Suffix; `listsNothingAtStart` entfällt.
5. Ablehnungen als `@ParameterizedTest` mit einer Zeile pro Fall (leerer Name, fehlender Name,
   Name zu lang, Menge zu lang; T1.3, T5.2). Statt Zählen prüft der Test, dass kein Artikel mit
   dem Namen der abgelehnten Anfrage in der Liste steht (bei leerem Namen: kein Artikel mit
   leerem Namen).
6. Neuer Test `createsTimeOrderedIds` (A1).
7. `ItemServiceTest`, `app.spec.ts`.
8. `docs/architecture/overview.md`, `project-rules/backend.md`.
9. `make check`, `make drift`, Prüfung A5 mit zufälliger Reihenfolge, Aufrufe A3 und A4.

Testdaten: keine Zustände. Jeder Test legt seine Artikel selbst an; der Browser-Check läuft im
Zustand `empty` (Backend neu gestartet), `project-rules/testing.md`.

Tests:

| Kriterium | Test |
|---|---|
| A1 | `ItemResourceTest`: `createsTimeOrderedIds` |
| A2 | `RequestIdFilterTest`: `setsRequestIdOnEveryResponse`, `keepsValidRequestIdFromRequest`, `replacesInvalidRequestId` |
| A3 | Aufruf: `make dev-backend`, `curl`, Konsolenzeile |
| A4 | Aufruf: `java -jar`, erste Logzeile ist JSON |
| A5 | Aufruf: `./mvnw test -Dtest=ItemResourceTest -Dsurefire.runOrder=random` |
| A6 | Datei: `ItemResourceTest` ohne JSON-String im Body, Builder `anItem()` |
| A7 | Datei: `ItemServiceTest`, `app.spec.ts` |

## Offene Fragen

Keine. Beantwortete Fragen stehen in der Tabelle Entscheidungen in `docs/specs/README.md`.

## Verifikationsplan

- make check (darin `make drift`)
- betroffene Tests: `backend/src/test/java/de/mmoller/einkaufsliste/item/`,
  `backend/src/test/java/de/mmoller/einkaufsliste/requestlog/`, `frontend/src/app/app.spec.ts`
- Aufrufe: A3 (`make dev-backend` und `curl`), A4 (`java -jar`), A5 (zufällige Reihenfolge)
- Browser: Startseite http://localhost:4200, Artikel anlegen, Liste unverändert (keine Änderung
  erwartet)
