# Mainhattan Mamas – Website v2

Statische Vereinswebsite für Mainhattan Mamas e.V. (https://mainhattan-mamas.de), gehostet bei Strato (PHP verfügbar, kein Node).
Seit 11.10.2026 ist **dieser Ordner der Live-Stand**. Eigenes Git-Repository → github.com/addek-lab/mainhattan-mamas (öffentlich).
Der Ordner darüber (`../`) ist der alte Stand (Tag `stand-2026-10-09`): nicht mehr bearbeiten, **nie nach GitHub** (Historie enthält das Strato-Passwort).

## Aufbau
- `src/` – Seiten, `styles.css`, `script.js`, `contact.php` (Honeypot `website`), Bilder (JPG), `fonts/` (lokal, Lora + Nunito Sans)
- `partials/` – gemeinsamer `head`, `header`, `footer`; in Seiten per `<!-- @include name -->`
- `icons/` – Lucide-SVGs (lucide-static 0.454.0), beim Build für `<i data-lucide="name"></i>` eingesetzt (Inline-Styles des `<i>` bleiben erhalten)
- `content/home.json` + Jinja-Platzhalter in `src/index.html` – Texte der Startseite (`CONTENT_FILES` in build.py). Stammt aus dem verworfenen Pages-CMS-Prototyp (`.pages.yml`); Startseiten-Texte also in `content/home.json` ändern.
- `archiv/` – herausgenommene Inhalte zum Wiederherstellen (z. B. `projekt-mini-fest.html`), wird nicht gebaut
- `build.py` → `dist/` (nicht in Git); Abhängigkeiten `requirements.txt` in `.venv/`
- `deploy.sh` – Upload von `dist/` per SFTP nach Strato `public_html`; Zugangsdaten in `.deploy.env` (nicht in Git, chmod 600)
- `.github/workflows/vorschau.yml` – nach jedem Push: Vorschau mit noindex auf https://addek-lab.github.io/mainhattan-mamas/
- `tools/` – Browser-Prüfung (siehe unten)

## Arbeitsablauf
1. Lokal ändern in `src/` (bzw. `partials/`, `content/`).
2. Bauen: `.venv/bin/python build.py` (Vorschau-Build: `PREVIEW=1 …`).
3. Lokal ansehen: `php -S localhost:8787 -t dist` → http://localhost:8787 (Port 8000/8080 sind belegt).
4. **Im sichtbaren Browser prüfen** (Desktop 1440 + Mobil 390), nicht nur headless:
   - `tools/chrome.sh` öffnet Chrome mit Fernsteuerung (Port 9333); einmalig `cd tools && npm install`
   - `node tools/walk.js projekte.html 390 /tmp/x` – Seite bildschirmweise durchgehen
   - `node tools/shot.js projekte.html 1440 ".btn-row" /tmp/x.png` – einzelnes Element
   - `node tools/check.js [https://mainhattan-mamas.de]` – alle Seiten: Überstehen, Fehler, externe Hosts
5. Lokal committen. **Push zu GitHub und Upload zu Strato nur auf ausdrückliche Ansage.**

## Live-Upload (Strato)
1. Sicherung des Servers: `public_html` per `sftp get -r` nach `../server-backup-<datum>/` (letzte: `../server-backup-2026-10-11`).
2. Hochladen: `echo j | ./deploy.sh` (baut ohne noindex, legt Ordner an, lädt alles aus `dist/` hoch). `./deploy.sh --dry-run` zeigt nur die Dateiliste.
3. Prüfen: `node tools/check.js https://mainhattan-mamas.de`, Inhalte per curl, Honeypot-Test
   `curl -X POST -H 'Content-Type: application/json' -d '{"website":"bot"}' https://mainhattan-mamas.de/contact.php` → success ohne Mail.
- Alte Dateien der Vorgängerversion (z. B. `vision_v2–v7.jpg`) liegen noch auf dem Server; sie stören nicht.
- Falls die Anmeldung scheitert: Strato-Passwort wurde geändert → neues in `.deploy.env` eintragen.

## Regeln
- Header/Menü/Footer nur in `partials/` ändern. Aktiver Menüpunkt kommt automatisch (`aria-current="page"`).
- Neues Icon: SVG aus `lucide-static` nach `icons/<name>.svg`, sonst bricht der Build ab.
- Neue Bilder als JPG nach `src/`; WebP, Größe, Lazy Loading und feste Maße macht der Build.
- Der Hero der Startseite (`startbild.jpg`, `.hero`) bleibt unverändert.
- Kein Tracking, keine externen Ressourcen – sonst Datenschutzerklärung anpassen. Kein Cookie-Banner (nicht nötig).
- Abstände über Klassen (`section--surface`, `section--intro`, `section-head`, `btn-row`, …) statt Inline-Styles; Projekte wechseln Hintergrund und Bildseite ab.
- Kontaktformular-Vorauswahl per `kontakt.html?projekt=<schlüssel>` (Zuordnung `projektCheckboxen` in `script.js`).
- Nach Arbeit in diesem Ordner keine Änderungen am alten Ordner `../` außer Backups.
