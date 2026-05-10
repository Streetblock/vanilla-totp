# vanilla-totp

Ein einfacher TOTP-Generator mit klar getrennter Architektur:

- `TOTPGenerator`: kryptografischer Core (Browser + Node kompatibel)
- `TOTPWidget`: UI-Controller für die Browser-Oberfläche

## Projektstruktur

- `index.html` - UI und App-Initialisierung
- `src/totp-generator.js` - TOTP-Core-Logik
- `src/totp-widget.js` - DOM/UI-Logik
- `tests/totp-generator.test.js` - Node-Test mit RFC6238-Testvektor

## Lokale Nutzung

1. Repository klonen
2. `index.html` im Browser öffnen
3. Optional Secret per URL übergeben:

```text
index.html?secret=JBSWY3DPEHPK3PXP
```

## Tests

Voraussetzung: Node.js (mit `node:test`, z. B. Node 18+)

```bash
node --test tests/totp-generator.test.js
```

## Hinweise

- Standardkonfiguration in der UI: `period=30`, `digits=6`
- Alle Berechnungen laufen lokal im Browser
