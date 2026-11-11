# 0007: JSON-Logs mit quarkus-logging-json und Request-Id im MDC

Status: accepted
Datum: 2026-11-11
Spec: docs/specs/0003-grundregeln-im-code-0001.md
Ersetzt Grundregeln: keine

## Kontext

A6.4 verlangt strukturierte Logs, einen Logger pro Anfrage mit Request-Id, keine personenbezogenen
Daten und keine Secrets im Log. Das Backend loggt bisher im Textformat und ohne Request-Id.
`quarkus-logging-json` ist eine neue Erweiterung und braucht ein ADR (Bedingung 2).

## Optionen

### Option A: `quarkus-logging-json`, Request-Id über einen Filter im MDC

- Vorteile: Der Quarkus-Standard; eine Property schaltet JSON ein, Profile `dev` und `test`
  bleiben lesbar. Der Filter ist klein und übernimmt eine mitgeschickte `X-Request-Id`.
- Nachteile: Eine Erweiterung mehr; kein Tracing über Systemgrenzen.

### Option B: Textformat mit Request-Id im Pattern

- Vorteile: Keine Erweiterung.
- Nachteile: Kein strukturiertes Log; A6.4 bliebe eine Abweichung mit eigenem ADR.

### Option C: `quarkus-opentelemetry` mit Trace-Id im MDC

- Vorteile: Tracing und Request-Kennung in einem; Standard bei mehreren Diensten.
- Nachteile: Collector und Konfiguration für eine lokale Anwendung mit einem Dienst.

## Entscheidung

Option A. Die Request-Id kommt aus dem Header `X-Request-Id`, wenn er höchstens 64 Zeichen aus
Buchstaben, Ziffern und Bindestrich enthält, sonst erzeugt der `IdGenerator` eine neue. Der
Filter legt sie als `requestId` in den MDC, gibt sie im Antwort-Header zurück und schreibt pro
Anfrage eine Zeile mit Methode, Pfad ohne Query und Status. Option C löst dieses ADR ab, sobald ein
zweiter Dienst dazukommt.

## Folgen

- `backend/pom.xml` erhält `quarkus-logging-json`; `application.properties` schaltet JSON außer in
  `dev` und `test` ein.
- `project-rules/backend.md`, Abschnitt Errors, logging, configuration: Logzeilen nennen keine
  Bodies und keine Query-Parameter; jede Zeile trägt `requestId`.
- `docs/architecture/overview.md`, Querschnitt Logging.
