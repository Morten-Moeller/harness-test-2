# 0008: Zustandsänderungen eines Artikels über PATCH mit Teilobjekt und Antwort 204

Status: accepted
Datum: 2026-11-11
Spec: docs/specs/0004-artikel-erledigen-und-filter.md
Ersetzt Grundregeln: keine

## Kontext

Spec 0004 führt die erste Änderung an einem bestehenden Artikel ein: erledigt setzen und wieder
öffnen. Die Form dieses Endpunkts prägt jede weitere Änderung (Name, Menge, Löschen). A2.4
verlangt für ein Kommando 204 oder 201; A4.4 eine atomare Zustandsänderung. Ein neuer
Contract-Teil ist high risk und braucht ein ADR (`harness/policies/adr.md`, Bedingungen 1 und 3).

## Optionen

### Option A: `PATCH /api/items/{id}` mit Teilobjekt `{done}`, Antwort 204

- Vorteile: Ein Endpunkt für Feldänderungen, erweiterbar um `name` und `quantity` ohne neuen
  Pfad; 204 folgt A2.4; das Frontend lädt die Liste neu (ADR 0004).
- Nachteile: Das Frontend braucht nach jeder Änderung einen `GET`; ein Teilobjekt mit mehreren
  optionalen Feldern braucht später eine Regel für "Feld fehlt" gegen "Feld ist null".

### Option B: Unterressourcen `POST /api/items/{id}/done` und `DELETE /api/items/{id}/done`

- Vorteile: Jedes Kommando ist ein eigener Pfad, kein Teilobjekt.
- Nachteile: Pro Feld zwei Pfade; die Liste der Kommandos wächst schneller als die Felder.

### Option C: `PUT /api/items/{id}` mit vollständigem Artikel

- Vorteile: Keine Teilobjekt-Regeln.
- Nachteile: Das Frontend schickt Felder, die es nicht ändern will; verlorene Updates bei zwei
  Clients.

## Entscheidung

Option A. `PATCH /api/items/{id}` nimmt ein Teilobjekt; in 0004 nur `done` (Pflicht). Ein
fehlendes Pflichtfeld ist 400, eine unbekannte Id 404, Erfolg 204 ohne Body. Weitere Felder
kommen als optionale Felder desselben Schemas; "Feld fehlt" heißt dann "unverändert". Das
Frontend lädt nach jeder Änderung die Liste neu, bis ADR 0004 abgelöst ist.

## Folgen

- `contracts/openapi.yaml` bekommt `PATCH /api/items/{id}` und `UpdateItemRequest`; die Version
  bleibt `1.0.0`.
- `project-rules/backend.md`, Abschnitt Errors: die Resource bildet "nicht gefunden" auf 404 ab,
  der Service kennt kein HTTP (A3.5).
- Löschen folgt nicht diesem ADR, sondern `DELETE /api/items/{id}` mit 204.
