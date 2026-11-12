# 0011: Sortierung und Verschieben über die optionalen Felder position und listId in PATCH

Status: accepted
Datum: 2026-11-12
Spec: docs/specs/0007-sortieren-per-drag-and-drop.md
Ersetzt Grundregeln: keine

## Kontext

Spec 0007 speichert eine Reihenfolge für Einkaufslisten und für die Artikel jeder Liste und
verschiebt Artikel zwischen Listen. ADR 0008 legt fest, dass Änderungen an einem Artikel über
`PATCH` mit Teilobjekt laufen und weitere Felder als optionale Felder desselben Schemas kommen;
"Feld fehlt" heißt "unverändert". Bisher sind `done` und `name` Pflichtfelder. A2.4 verlangt für
ein Kommando 204, A4.4 eine atomare Zustandsänderung. Die Person hat die Form "Position je
Eintrag" gewählt.

## Optionen

### Option A: Optionales Feld `position` (und `listId` beim Artikel) im bestehenden `PATCH`

- Vorteile: Folgt ADR 0008; ein Endpunkt je Ressource für alle Feldänderungen; `done`, `name`
  und `position` lassen sich in einem Aufruf setzen; das Verschieben in eine andere Liste ist
  dasselbe Teilobjekt mit `listId`.
- Nachteile: `done` und `name` werden optional, ein leeres Teilobjekt braucht eine eigene Prüfung
  (400); die Position ist ein Index, den der Client aus der vollständigen Liste rechnet.

### Option B: Reihenfolge als Ganzes, `PUT /api/lists/order` und `PUT /api/lists/{listId}/items/order`

- Vorteile: Ein Aufruf pro Ablegen, keine Indexrechnung im Backend, keine Änderung an den
  bestehenden Teilobjekten.
- Nachteile: Zwei neue Endpunkte; der Client schickt alle Ids, auch bei einer Liste mit vielen
  Artikeln; das Verschieben zwischen Listen braucht trotzdem einen dritten Weg.

### Option C: Feld `sortKey` je Eintrag, Client vergibt Schlüssel zwischen Nachbarn

- Vorteile: Kein Nachschieben anderer Einträge im Backend.
- Nachteile: Schlüsselvergabe und Neuverteilung im Client; für eine lokale Testanwendung ohne
  Datenbank ohne Nutzen.

## Entscheidung

Option A. `UpdateShoppingListRequest {name?, position?}` und `UpdateItemRequest {done?,
position?, listId?}`; jedes Feld ist optional, ein Teilobjekt ohne Feld ist 400. `position` ist
der 0-basierte Index nach der Änderung in der Ziel-Liste; außerhalb des Bereichs ist 400.
`listId` nennt die Ziel-Liste des Artikels; ohne `position` kommt er ans Ende; eine unbekannte
Ziel-Liste ist 404. Das Backend führt Verschieben und Umsortieren unter einer Sperre aus (A4.4).
Die Version des Contracts bleibt `2.0.0`, weil Pflichtfelder optional werden und nur optionale
Felder dazukommen.

## Folgen

- `contracts/openapi.yaml`: `UpdateShoppingListRequest` und `UpdateItemRequest` ohne
  Pflichtfelder, mit `position` und `listId`.
- Backend: die Repositories halten Listen statt `LinkedHashMap`; ein Ergebnis-Enum `UpdateResult`
  trägt "nicht gefunden", "Ziel nicht gefunden" und "ungültige Position" an die Resource (A3.5).
- Weitere Felder eines Artikels (Name, Menge) folgen demselben Muster.
