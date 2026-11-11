# Specs

Jede Änderung beginnt mit einer Spec (`harness/workflow.md`). Statuswerte: `draft`, `approved`,
`in Arbeit`, `Review`, `fertig`, `done`, `blockiert`.

| Nr | Titel | Risiko | Status | PR | Stand | Offene Fragen | Notiz |
|---|---|---|---|---|---|---|---|
| 0001 | Artikel anlegen | high | done | #3 | 2026-11-10 | – | alle Kriterien erfüllt, Browser-Test auf Ersatzports 4201/8081 |
| 0002 | Harness 0.5.0 übernehmen | high | done | #4 | 2026-11-11 | – | Update von 0.3.1, manuelle Schritte aus dem Changelog |
| 0003 | Grundregeln im Code von Feature 0001 umsetzen | medium | done | #9 | 2026-11-11 | – | alle Kriterien erfüllt, kein Browser-Test nötig |
| 0004 | Artikel erledigen und Filter | high | approved | – | 2026-11-11 | – | freigegeben in der Session |

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
