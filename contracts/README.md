# Contracts

Contracts sind die Vereinbarung zwischen Backend und Frontend. Jede Änderung hier ist high risk
(`harness/policies/risk.md`) und braucht eine Spec mit Abschnitt `## Contracts`. Entscheidung:
`docs/adr/0001-openapi-contract-code-first.md`.

## Dateien

| Datei | Rolle | Erzeugt durch |
|---|---|---|
| `contracts/openapi.yaml` | OpenAPI-Dokument der REST-API unter `/api` | Quarkus-Build aus den Java-Typen und Annotationen im Backend (`quarkus.smallrye-openapi.store-schema-directory`) |
| `frontend/src/app/shared/api.ts` | TypeScript-Typen für das Frontend | `openapi-typescript` aus `contracts/openapi.yaml` |

`contracts/openapi.json` entsteht beim Build neben der YAML-Datei und ist über `.gitignore`
ausgeschlossen; nur die YAML-Datei ist der Contract.

## Regeln

- Quelle des Contracts sind die Java-Typen, die Jakarta-REST-Annotationen, die Bean-Validation-
  Annotationen und die MicroProfile-OpenAPI-Annotationen im Backend. Beide generierten Dateien
  werden nie von Hand geändert.
- `make contracts` erzeugt beide Dateien. Eine API-Änderung besteht aus der Java-Änderung und den
  beiden generierten Dateien im selben Commit (Skill `contract`).
- Der Build eines Branches darf `make contracts` nicht verändern:
  `make contracts && git diff --exit-code contracts frontend/src/app/shared/api.ts`.
- Version: `info.version`, gesetzt über `quarkus.smallrye-openapi.info-version` in
  `backend/src/main/resources/application.properties`. Kompatible Änderungen (neues optionales
  Feld, neuer Endpunkt, neuer Enum-Wert) behalten die Version. Brechende Änderungen (entferntes
  oder umbenanntes Feld, Typänderung, neues Pflichtfeld, geänderter Statuscode) erhöhen die
  Hauptversion und brauchen ein ADR mit Migrationspfad für jeden Konsumenten
  (`harness/policies/adr.md`).
- Konsument: das Frontend in `frontend/`. Weitere Konsumenten werden hier eingetragen.
