# Systemübersicht

## Kontext

| Akteur / System | Rolle | Schnittstelle |
|---|---|---|
| Person im Browser | pflegt ihre Einkaufsliste | Web-Oberfläche, http://localhost:4200 |

Keine fremden Systeme.

## Container

| Container | Technik | Verantwortung | Spricht mit |
|---|---|---|---|
| Frontend | Angular 22, `frontend/` | Oberfläche, Zustand der Ansicht | Backend über REST unter `/api` |
| Backend | Quarkus 3.40, Java 21, `backend/` | Regeln und Speicherung der Einkaufslisten | – |

## Modulgrenzen

- Das Frontend spricht nur über REST unter `/api` mit dem Backend; es kennt keine Backend-Klassen.
- Das Backend kennt das Frontend nicht.
- Im Backend: Resource → Service → Repository, nie in die Gegenrichtung (`project-rules/backend.md`).
- Im Frontend importiert ein Feature nie aus einem anderen Feature (`project-rules/frontend.md`).

## Querschnitt

- Authentifizierung: keine, lokale Testanwendung.
- Logging: Quarkus-Log im Backend, keine Request-Bodies.
- Fehlerbehandlung: HTTP-Status nach `project-rules/backend.md`, das Frontend zeigt eine Meldung.
- Konfiguration: `backend/src/main/resources/application.properties`, im Frontend keine.
