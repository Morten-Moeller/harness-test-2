# 0006: UUIDv7 mit java-uuid-generator

Status: accepted
Datum: 2026-11-11
Spec: docs/specs/0003-grundregeln-im-code-0001.md
Ersetzt Grundregeln: keine

## Kontext

A4.2 verlangt zeitlich geordnete Ids (UUIDv7), die die Anwendung selbst erzeugt. Java 21 hat nur
`UUID.randomUUID()` (Version 4). Feature 0001 nutzt es. Eine neue Abhängigkeit braucht ein ADR
(`harness/policies/adr.md`, Bedingung 2). Die Person hat entschieden, den in der Sprache
üblichen Generator zu nehmen statt eines eigenen.

## Optionen

### Option A: `com.fasterxml.uuid:java-uuid-generator`

- Vorteile: Verbreitet, ohne weitere Abhängigkeiten, `Generators.timeBasedEpochGenerator()` ist
  innerhalb einer Millisekunde monoton; vom Jackson-Team, das im Quarkus-Stack schon steht.
- Nachteile: Eine Abhängigkeit mehr, die Dependabot pflegt.

### Option B: `com.github.f4b6a3:uuid-creator`

- Vorteile: Nur für UUIDs gebaut, ebenfalls verbreitet und ohne weitere Abhängigkeiten.
- Nachteile: Wie A; zweiter Hersteller im Stack.

### Option C: Eigener Generator

- Vorteile: Keine Abhängigkeit.
- Nachteile: Eigener Code für ein gelöstes Problem; die Person hat sich dagegen entschieden.

## Entscheidung

Option A. Ein Plattform-Paket `ids` mit einem `IdGenerator`-Bean kapselt die Bibliothek; Features
rufen `next()`. Mit einer Datenbank bleibt die Id in der Anwendung (A4.2, kein Round-Trip).

## Folgen

- `backend/pom.xml` erhält die Abhängigkeit; `project-rules/backend.md` nennt `IdGenerator`.
- Ids aus Feature 0001, die vor dieser Änderung entstanden sind, gibt es nicht dauerhaft
  (Speicher im Arbeitsspeicher).
