# 0012: @angular/cdk (DragDropModule) für Drag and Drop, Tastaturweg über Buttons

Status: accepted
Datum: 2026-11-12
Spec: docs/specs/0007-sortieren-per-drag-and-drop.md
Ersetzt Grundregeln: keine

## Kontext

Spec 0007 verlangt Sortieren per Ziehen mit Maus und Finger, innerhalb einer Liste, über Listen
hinweg und für die Tafeln in einem Raster. `project-rules/frontend.md` sagt "keine
Komponentenbibliothek vorerst"; A1.7 erlaubt eine Bibliothek je Anliegen; A7.5 verlangt, dass
jedes interaktive Element mit der Tastatur bedienbar ist. Eine neue Abhängigkeit braucht ein ADR
(`harness/policies/adr.md`, Bedingung 2).

## Optionen

### Option A: `@angular/cdk` mit `DragDropModule`

- Vorteile: Vom Angular-Team gepflegt, gleiche Hauptversion wie `@angular/core`; Touch, Maus,
  verbundene Drop-Listen (`cdkDropListGroup`), Raster (`cdkDropListOrientation="mixed"`),
  Platzhalter und Vorschau ohne eigenen Code; nur das eine Modul wird importiert.
- Nachteile: Neue Abhängigkeit im Manifest; kein Tastaturweg für das Ziehen selbst.

### Option B: Natives HTML5 Drag and Drop

- Vorteile: Keine Abhängigkeit.
- Nachteile: Kein Touch auf Mobilgeräten, uneinheitliche Vorschau je Browser, eigener Code für
  Platzhalter, Raster und verbundene Listen; mehr Tests ohne Mehrwert.

### Option C: Nur Buttons `Nach oben` und `Nach unten`, kein Ziehen

- Vorteile: Keine Abhängigkeit, Tastatur und Maus gleich.
- Nachteile: Erfüllt den Wunsch der Person nicht (Ziehen); viele Klicks bei langen Listen.

## Entscheidung

Option A. `@angular/cdk` kommt in der Hauptversion von `@angular/core` in `frontend/package.json`;
importiert werden nur `CdkDropList`, `CdkDrag`, `CdkDragHandle` und `CdkDropListGroup` aus
`@angular/cdk/drag-drop`. Der Tastaturweg sind die Buttons `Nach oben` und `Nach unten` je Zeile
und je Tafel (A7.5); der Griff ist ein Button mit zugänglichem Namen, damit Screenreader ihn
nennen, die Tastatur nutzt die Buttons. Weitere Teile des CDK oder eine Komponentenbibliothek
brauchen ein eigenes ADR.

## Folgen

- `frontend/package.json`, `frontend/pnpm-lock.yaml`: `@angular/cdk`; Dependabot hält die Version
  mit `@angular/core` zusammen.
- `project-rules/frontend.md`, Abschnitt UI: "`@angular/cdk` nur `DragDropModule` (ADR 0012);
  sonst keine Komponentenbibliothek."
- Ziehen hat keinen Komponententest (jsdom kennt keine Zeiger-Gesten); `/verify` prüft es im
  Browser, die Buttons und die Indexrechnung haben Tests.
