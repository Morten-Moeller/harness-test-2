# Einkaufsliste

Kleine Einkaufslisten-Anwendung: Angular im Frontend, Quarkus im Backend. Das Projekt dient als
erster Test des AI Development Harness.

## Arbeiten in diesem Repository

Das Repository nutzt den AI Development Harness. Einstieg: `AGENTS.md` und `harness/README.md`.

| Ich will | Dann |
|---|---|
| eine Änderung vorschlagen | `/spec <Thema>` in Claude Code, danach gibt eine Person die Spec frei |
| eine freigegebene Spec umsetzen | `/implement <Spec-Nr>` |
| eine Entscheidung festhalten | `/adr <Titel>` |
| einen Pull Request prüfen | `/review <PR>`, `/verify <PR>` |
| alle Quality Gates laufen lassen | `make check` |

## Einrichtung

```bash
nvm use                 # Node aus .nvmrc
make install            # Frontend-Abhängigkeiten
make dev-backend        # Quarkus auf http://localhost:8080
make dev-frontend       # Angular auf http://localhost:4200
make test typecheck lint
```

Java 21 muss installiert sein; auf macOS findet das Makefile es über `/usr/libexec/java_home`.
`make sast` und `make deps` brauchen semgrep, gitleaks und osv-scanner (`brew install semgrep
gitleaks osv-scanner`); in CI sind sie installiert.

## Struktur

```text
frontend/        Angular-Anwendung
backend/         Quarkus-Anwendung
docs/            Domäne, Specs, ADRs, Architektur
contracts/       API-Contracts
project-rules/   Regeln für Frontend, Backend, Tests
harness/         Workflow, Policies, Quality Gates (vom Harness verwaltet)
```

Harness-Version: siehe `HARNESS_VERSION`. Aktualisieren mit `harness/scripts/update.sh`.
