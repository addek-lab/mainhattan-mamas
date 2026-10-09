# Mainhattan Mamas – Website v2

Statische Vereinswebsite (mainhattan-mamas.de), gehostet bei Strato (PHP verfügbar).
Eigenes Git-Repository (GitHub: Addek-lab/mainhattan-mamas). Der Ordner darüber (`../`) ist der gesicherte alte Live-Stand (Git-Tag `stand-2026-10-09`), wird nicht mehr bearbeitet und darf nie nach GitHub (enthält Zugangsdaten in der Historie).

## Aufbau
- `src/` – Seiten, `styles.css`, `script.js`, `contact.php`, Bilder (JPG), `fonts/`
- `partials/` – gemeinsamer `head`, `header`, `footer`; in Seiten per `<!-- @include name -->`
- `icons/` – Lucide-SVGs (v0.454.0), werden beim Build für `<i data-lucide="name"></i>` eingesetzt
- `content/*.json` – redaktionelle Texte, bearbeitbar über Pages CMS (`.pages.yml`); Seiten mit Inhaltsdatei sind Jinja-Templates (`CONTENT_FILES` in build.py)
- `build.py` → `dist/` (nicht in Git); Abhängigkeiten in `requirements.txt`, lokal in `.venv/`
- `.github/workflows/vorschau.yml` – baut nach jedem Push (auch aus Pages CMS) eine Vorschau auf GitHub Pages (noindex)
- `deploy.sh` – lädt `dist/` per SFTP hoch; Zugangsdaten in `.deploy.env` (nicht in Git)

## Regeln
- Header/Menü/Footer nur in `partials/` ändern, nie in einzelnen Seiten.
- Aktiver Menüpunkt wird automatisch per `aria-current="page"` gesetzt – keine `nav-link--active`-Klassen von Hand.
- Neues Icon: SVG aus `lucide-static` nach `icons/<name>.svg` kopieren, sonst bricht der Build ab.
- Neue Bilder einfach als JPG nach `src/`; WebP, Größe und Lazy Loading erledigt der Build.
- Der Hero der Startseite (`startbild.jpg`, `.hero`) bleibt unverändert.
- Kein Tracking, keine externen Ressourcen (Fonts/Icons/Skripte) – sonst muss die Datenschutzerklärung angepasst werden.
- Texte von CMS-Seiten nur in `content/*.json` ändern, nicht im Template. Neue Felder immer auch in `.pages.yml` eintragen.
- Vor eigener Arbeit `git pull`, da die Kundin über Pages CMS direkt auf `main` committet.
- Nach Änderungen: `.venv/bin/python build.py`, dann `dist/` lokal prüfen (`php -S localhost:8787 -t dist`).
- Live-Upload (`./deploy.sh`) nur nach ausdrücklicher Freigabe.
