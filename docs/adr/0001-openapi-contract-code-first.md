# 0001: OpenAPI-Contract code-first aus Quarkus, Frontend-Typen mit openapi-typescript

Status: accepted
Datum: 2026-11-10
Spec: docs/specs/0001-artikel-anlegen.md

## Kontext

Spec 0001 ist die erste API-Spec. `project-rules/backend.md` legt fest, dass die erste API-Spec
entscheidet, wie das OpenAPI-Dokument nach `contracts/` kommt. `project-rules/frontend.md`
verlangt, dass Request- und Response-Typen im Frontend aus dem Contract kommen, sobald einer
existiert, ohne handgeschriebene Kopien. `AGENTS.md` verbietet das Bearbeiten generierter Dateien;
sie werden mit dem Ziel aus `contracts/README.md` erzeugt.

Kräfte: ein Projekt mit einer Person und zwei Modulen (Angular, Quarkus); `quarkus-smallrye-openapi`
ist bereits eingebunden und erzeugt das Dokument aus den Jakarta-REST-Annotationen; es gibt keinen
fremden Konsumenten außer dem eigenen Frontend; `contracts/` ist high risk, jede Änderung dort
läuft durch alle Reviews.

## Optionen

### Option A: Code-first, Export aus Quarkus, Typen mit openapi-typescript

Quelle des Contracts sind die Java-Typen und Annotationen. `quarkus.smallrye-openapi.store-schema-directory`
schreibt `contracts/openapi.yaml` bei jedem Build. `openapi-typescript` erzeugt daraus
`frontend/src/app/shared/api.ts`. Beides über `make contracts`.

- Vorteile: kein zweites Modell, das mit dem Code auseinanderlaufen kann; nutzt die vorhandene
  Extension; Bean-Validation-Annotationen landen als Schema-Constraints im Contract; eine
  Dev-Abhängigkeit ohne Laufzeitcode im Frontend; die Review-Regel `generiert` greift über die
  Kopfzeile des Generators.
- Nachteile: das Backend bestimmt die Form der API, eine Diskussion über das Design findet in der
  Spec statt, nicht in einer YAML-Datei; der Export braucht einen Backend-Build (`package`), also
  Java und Maven auf dem Rechner, der den Contract erneuert; ein geänderter Java-Typ ändert den
  Contract unbemerkt, wenn `make contracts` nicht läuft (A9 der Spec und der Diff in CI fangen
  das).

### Option B: Design-first, handgeschriebene openapi.yaml, Server-Interfaces generiert

`contracts/openapi.yaml` wird von Hand geschrieben. `openapi-generator` erzeugt daraus
Jakarta-REST-Interfaces für das Backend und TypeScript-Typen für das Frontend.

- Vorteile: der Contract ist die Quelle, Backend und Frontend folgen ihm; API-Design ist in der
  Spec und im Review direkt sichtbar.
- Nachteile: zusätzliches Maven-Plugin und Generator-Templates, deren Ausgabe mit
  `quarkus-rest-jackson` und Bean Validation zusammenpassen muss; zwei Generatorläufe und zwei
  Werkzeugketten für ein Projekt mit einer Person; `quarkus-smallrye-openapi` erzeugt dann ein
  zweites, abweichendes Dokument unter `/q/openapi`, das stillgelegt oder abgeglichen werden muss.

### Option C: Kein Contract in contracts/, Frontend-Typen von Hand

OpenAPI nur zur Laufzeit unter `/q/openapi`. Das Frontend schreibt seine Typen selbst.

- Vorteile: kein Werkzeug, kein high-risk-Pfad, kleinster Umfang für die erste Spec.
- Nachteile: zwei Typdefinitionen ohne Prüfung gegeneinander; `project-rules/frontend.md` erlaubt
  das nur, bis ein Contract existiert; die Entscheidung wird nur vertagt. Die Person hat diese
  Option bei der Spec 0001 abgelehnt.

## Entscheidung

Option A. Der Contract wird aus dem Backend erzeugt, weil die Extension vorhanden ist, das Frontend
der einzige Konsument ist und ein zweites Modell für eine Person mehr Pflege als Nutzen bringt.
`make contracts` erzeugt `contracts/openapi.yaml` und `frontend/src/app/shared/api.ts`; beide
Dateien sind generiert und werden nie von Hand geändert. Die Contract-Version steht in
`info.version`; kompatible Änderungen behalten sie, brechende erhöhen die Hauptversion und
brauchen ein ADR mit Migrationspfad (`harness/policies/adr.md`, `contracts/README.md`).

## Folgen

- `contracts/README.md` entsteht mit Spec 0001 und schreibt fest: Quelle sind die Java-Typen,
  `openapi.yaml` und `shared/api.ts` sind generiert, `make contracts` erzeugt beide, Versionierung
  über `info.version`.
- `project-rules/backend.md`, Abschnitt APIs: der offene Satz zu `contracts/` wird durch den
  Verweis auf dieses ADR ersetzt. Das ist eine Änderung an `project-rules/`, die die Person im PR
  der Spec 0001 sieht.
- `harness/config.yml`: `contracts_generate_target: contracts` setzt die Person; Agenten dürfen die
  Datei nicht ändern.
- Jede spätere API-Änderung läuft über den Skill `contract`: Java ändern, `make contracts`, beide
  generierten Dateien im selben Commit.
- Der Export braucht einen Backend-Build. CI prüft über A9 der Spec 0001, dass die eingecheckten
  generierten Dateien zum Code passen.
