# 0004: Serverdaten im Frontend in Signals ohne Query-Cache

Status: proposed
Datum: 2026-11-11
Spec: keine
Ersetzt Grundregeln: A7.1, A7.2, T1.4

## Kontext

A7.1 legt Serverdaten in einen Query-Cache, A7.2 lässt einen Schreibzugriff die betroffenen
Lesezugriffe ungültig machen statt von Hand nachzuladen. `project-rules/frontend.md` sieht
Signals je Komponente und einen Service je Feature mit `HttpClient` vor; Feature 0001 hängt das
neue Element nach dem POST selbst an die Liste (`frontend/src/app/items/items.ts`). Die Specs
ersetzen das Backend mit `provideHttpClientTesting` (T1.4).

## Optionen

### Option A: Signals je Komponente, HTTP-Testdoubles in den Specs

- Vorteile: Keine weitere Bibliothek; die Anwendung hat eine Ansicht und einen Endpunkt.
- Nachteile: Jede Komponente lädt selbst; mit mehreren Ansichten entstehen doppelte Ladevorgänge
  und veraltete Daten.

### Option B: Query-Cache (TanStack Query für Angular oder `httpResource`)

- Vorteile: Entspricht A7.1 und A7.2; Nachladen und Invalidierung an einer Stelle.
- Nachteile: Neue Abhängigkeit oder experimentelle Angular-API; Umbau von 0001.

## Entscheidung

Option A, solange eine Ansicht die Daten eines Features zeigt. Die erste Spec, in der zwei
Ansichten dieselben Serverdaten brauchen, führt Option B ein und löst dieses ADR ab. In den
Specs bleibt `HttpTestingController` das Double für das Backend: es läuft als eigener Prozess und
ist aus Sicht der Frontend-Tests ein fremdes System.

## Folgen

- `project-rules/frontend.md`, Abschnitt State and data, bleibt wie er ist.
- Ein Schreibzugriff darf die Liste nur dann von Hand ergänzen, wenn die Antwort des Backends das
  vollständige Element liefert; sonst wird neu geladen.
