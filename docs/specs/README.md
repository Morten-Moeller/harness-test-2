# Specs

Jede Änderung beginnt mit einer Spec (`harness/workflow.md`). Statuswerte: `draft`, `approved`,
`in Arbeit`, `Review`, `done`, `blockiert`. `done` setzt `verify` vor dem Merge, mit dem Status
`verified` auf dem geprüften Commit (G3).

| Nr | Titel | Risiko | Status | PR | Stand | Offene Fragen | Notiz |
|---|---|---|---|---|---|---|---|
| 0001 | Artikel anlegen | high | done | #3 | 2026-11-10 | – | alle Kriterien erfüllt, Browser-Test auf Ersatzports 4201/8081 |
| 0002 | Harness 0.5.0 übernehmen | high | done | #4 | 2026-11-11 | – | Update von 0.3.1, manuelle Schritte aus dem Changelog |
| 0003 | Grundregeln im Code von Feature 0001 umsetzen | medium | done | #9 | 2026-11-11 | – | alle Kriterien erfüllt, kein Browser-Test nötig |
| 0004 | Artikel erledigen und Filter | high | done | #11 | 2026-11-11 | – | alle Kriterien erfüllt, Browser-Test auf 4201 |
| 0005 | Harness 0.6.0 übernehmen | high | done | #13 | 2026-11-11 | – | alle Kriterien erfüllt, kein Browser-Test nötig |
| 0006 | Mehrere Einkaufslisten mit Überschrift, nebeneinander oder untereinander | high | done | #15 | 2026-11-12 | – | alle Kriterien erfüllt, Browser-Test auf 4201 |
| 0007 | Einkaufslisten und Artikel per Drag and Drop sortieren | high | Review | – | 2026-11-12 | – | – |

## Entscheidungen

Antworten auf offene Fragen aus Specs, mit der Person, die entschieden hat.

| Datum | Spec | Entscheidung | Wer |
|---|---|---|---|
| 2026-11-10 | 0001 | `contracts_generate_target: contracts` in `harness/config.yml` setzt die Person vor `/implement`. | Morten Möller |
| 2026-11-10 | 0001 | Artikel mit gleichem Namen dürfen mehrfach angelegt werden, kein 409. | Morten Möller |
| 2026-11-11 | 0002 | ADRs 0002 bis 0005 angenommen (Status `accepted`). | Morten Möller |
| 2026-11-11 | 0003 | UUIDv7 über `java-uuid-generator`, kein eigener Generator (ADR 0006). | Morten Möller |
| 2026-11-11 | 0003 | JSON-Logs über `quarkus-logging-json`, Text in dev und test (ADR 0007). | Morten Möller |
| 2026-11-11 | 0003 | Request-Id aus `X-Request-Id` übernehmen, wenn gültig, sonst erzeugen. | Morten Möller |
| 2026-11-11 | 0003 | `listsNothingAtStart` entfällt ohne Ersatz; Tests prüfen nur eigene Artikel. | Morten Möller |
| 2026-11-11 | 0004 | Umschalter steht beim Laden auf "alle Artikel"; keine Speicherung der Einstellung. | Morten Möller |
| 2026-11-11 | 0004 | Der Filter "nur offene" wirkt nur im Frontend; `GET /api/items` bleibt ohne Parameter. | Morten Möller |
| 2026-11-11 | 0004 | Erledigt über eine Checkbox pro Zeile, Wiederöffnen durch Abhaken. | Morten Möller |
| 2026-11-11 | 0004 | `PATCH /api/items/{id}` antwortet 204, das Frontend lädt die Liste neu (ADR 0008, A2.4). | Morten Möller |
| 2026-11-12 | 0006 | Anordnung über einen Umschalter in der Oberfläche; beim Laden `Nebeneinander`; keine Speicherung. | Morten Möller |
| 2026-11-12 | 0006 | Artikel als Unterressource `/api/lists/{listId}/items`; `/api/items` entfällt, Contract 2.0.0 (ADR 0010). | Morten Möller |
| 2026-11-12 | 0006 | Einkaufslisten anlegen, umbenennen und löschen in dieser Spec; Löschen sofort ohne Dialog. | Morten Möller |
| 2026-11-12 | 0006 | Formular für Artikel und Filter `Nur offene anzeigen` je Einkaufsliste. | Morten Möller |
| 2026-11-12 | 0007 | Drag and Drop über `@angular/cdk`, Tastaturweg über Buttons `Nach oben` und `Nach unten` (ADR 0012). | Morten Möller |
| 2026-11-12 | 0007 | Reihenfolge als optionales Feld `position` je Eintrag in `PATCH`; Verschieben über `listId` (ADR 0011). | Morten Möller |
| 2026-11-12 | 0007 | Artikel dürfen in eine andere Einkaufsliste gezogen werden. | Morten Möller |
| 2026-11-12 | 0007 | Sortieren auch bei aktivem Filter: sichtbare Artikel untereinander, erledigte behalten ihre relative Position. | Morten Möller |
| 2026-11-12 | 0007 | Buttons `Nach oben` und `Nach unten` nur bei Tastaturfokus sichtbar, für Screenreader immer vorhanden. | Morten Möller |
