# Specs

Jede Änderung beginnt mit einer Spec (`harness/workflow.md`). Statuswerte: `draft`, `approved`,
`in Arbeit`, `Review`, `fertig`, `done`, `blockiert`.

| Nr | Titel | Risiko | Status | PR | Stand | Offene Fragen | Notiz |
|---|---|---|---|---|---|---|---|
| 0001 | Artikel anlegen | high | done | #3 | 2026-11-10 | – | alle Kriterien erfüllt, Browser-Test auf Ersatzports 4201/8081 |
| 0002 | Harness 0.5.0 übernehmen | high | done | #4 | 2026-11-11 | – | Update von 0.3.1, manuelle Schritte aus dem Changelog |

## Entscheidungen

Antworten auf offene Fragen aus Specs, mit der Person, die entschieden hat.

| Datum | Spec | Entscheidung | Wer |
|---|---|---|---|
| 2026-11-10 | 0001 | `contracts_generate_target: contracts` in `harness/config.yml` setzt die Person vor `/implement`. | Morten Möller |
| 2026-11-10 | 0001 | Artikel mit gleichem Namen dürfen mehrfach angelegt werden, kein 409. | Morten Möller |
| 2026-11-11 | 0002 | ADRs 0002 bis 0005 angenommen (Status `accepted`). | Morten Möller |
