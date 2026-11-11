# 0005: Deutsche Texte und Farbwerte direkt in Templates und CSS

Status: proposed
Datum: 2026-11-11
Spec: keine
Ersetzt Grundregeln: A7.3, A7.4

## Kontext

A7.3 verlangt einen i18n-Schlüssel für jeden Text und eine Prüfung auf fehlende und ungenutzte
Schlüssel; A7.4 verlangt Design-Tokens für Farben, Abstände und Schrift. `project-rules/frontend.md`
legt fest: Texte auf Deutsch direkt in den Templates, kein i18n-Framework, einfaches CSS je
Komponente ohne Komponentenbibliothek. Feature 0001 ist so gebaut.

## Optionen

### Option A: Texte und Werte direkt im Code

- Vorteile: Kein Framework, keine Schlüsseldateien; die Anwendung hat eine Sprache und wenige
  Ansichten.
- Nachteile: Eine zweite Sprache oder ein Farbwechsel trifft jede Komponente.

### Option B: i18n-Schlüssel (`@angular/localize`) und CSS-Custom-Properties als Tokens

- Vorteile: Entspricht A7.3 und A7.4; Prüfung der Schlüssel im Lint.
- Nachteile: Build pro Sprache, Schlüsseldateien, Umbau von 0001.

## Entscheidung

Option A für eine einsprachige lokale Anwendung. Die erste Spec mit einer zweiten Sprache führt
i18n-Schlüssel ein; die erste Spec mit mehr als drei Komponenten mit eigenem CSS führt Tokens in
`frontend/src/styles.css` ein. Jede der beiden löst den passenden Teil dieses ADRs ab.

## Folgen

- `project-rules/frontend.md`, Abschnitt UI, bleibt wie er ist.
- Neue Komponenten nutzen bis dahin die Farbwerte aus `frontend/src/app/items/items.css`, keine
  weiteren.
