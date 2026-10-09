#!/usr/bin/env python3
"""Baut die Website aus src/ nach dist/.

- setzt die gemeinsamen Bausteine aus partials/ ein (<!-- @include name -->)
- markiert den aktuellen Menüpunkt mit aria-current="page"
- ersetzt <i data-lucide="..."></i> durch eingebettete SVGs aus icons/
- erzeugt verkleinerte WebP-Versionen der Bilder (JPG bleibt als Fallback)
- hängt Inhalts-Hashes an styles.css / script.js (Cache-Busting)
- füllt Seiten mit Texten aus content/*.json (bearbeitbar in Pages CMS)

Aufruf (aus dem Ordner v2/):
  .venv/bin/python build.py              normaler Build
  PREVIEW=1 .venv/bin/python build.py    Vorschau: noindex, nicht für Suchmaschinen
"""
import hashlib
import json
import os
import re
import shutil

from jinja2 import Environment
from markupsafe import Markup, escape
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
PARTIALS = os.path.join(ROOT, 'partials')
ICONS = os.path.join(ROOT, 'icons')
CONTENT = os.path.join(ROOT, 'content')

PREVIEW = os.environ.get('PREVIEW') == '1'
# Seiten, deren Texte aus einer Inhaltsdatei kommen
CONTENT_FILES = {'index.html': 'home.json'}

MAX_IMG_WIDTH = 1200
# Bilder, die unverändert ausgeliefert werden (Hero der Startseite bleibt wie er ist)
KEEP_IMAGES = {'startbild.jpg'}
# Icons, die script.js zur Laufzeit braucht
SCRIPT_ICONS = ['loader', 'check-circle-2', 'alert-circle']


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def short_hash(path):
    with open(path, 'rb') as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


# ── Icons ────────────────────────────────────────────────────
def load_icon(name):
    path = os.path.join(ICONS, name + '.svg')
    if not os.path.exists(path):
        raise SystemExit(f'Icon fehlt: icons/{name}.svg')
    svg = read(path)
    svg = re.sub(r'<!--.*?-->', '', svg, flags=re.DOTALL)
    svg = re.sub(r'\s+', ' ', svg).replace('> <', '><').strip()
    return svg


def render_icon(name, extra_class='', extra_attrs=''):
    svg = load_icon(name)
    classes = f'lucide lucide-{name}' + (f' {extra_class}' if extra_class else '')
    attrs = f'class="{classes}" aria-hidden="true"' + (f' {extra_attrs}' if extra_attrs else '')
    return re.sub(r'class="[^"]*"', attrs, svg, count=1)


def replace_icons(html):
    def repl(m):
        attrs = m.group(1)
        name = re.search(r'data-lucide="([^"]+)"', attrs).group(1)
        cls = re.search(r'class="([^"]*)"', attrs)
        # übrige Attribute (z. B. style) wie bei lucide.createIcons() übernehmen
        rest = re.sub(r'\s*(data-lucide|class)="[^"]*"', '', attrs).strip()
        return render_icon(name, cls.group(1) if cls else '', rest)
    return re.sub(r'<i\s+([^>]*data-lucide="[^"]+"[^>]*)>\s*</i>', repl, html)


# ── Bilder ───────────────────────────────────────────────────
image_sizes = {}


def process_image(name):
    src = os.path.join(SRC, name)
    dst = os.path.join(DIST, name)
    if name in KEEP_IMAGES:
        shutil.copy2(src, dst)
        return
    img = Image.open(src)
    if img.width > MAX_IMG_WIDTH:
        img = img.resize((MAX_IMG_WIDTH, round(img.height * MAX_IMG_WIDTH / img.width)), Image.LANCZOS)
    img = img.convert('RGB')
    img.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)
    img.save(os.path.splitext(dst)[0] + '.webp', 'WEBP', quality=80, method=6)
    image_sizes[name] = img.size


def enhance_images(html):
    """<img src="x.jpg"> -> <picture> mit WebP-Quelle, Lazy Loading und festen Maßen."""
    def repl(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        if src not in image_sizes:
            return tag
        w, h = image_sizes[src]
        if 'width=' not in tag:
            tag = tag.replace('<img ', f'<img width="{w}" height="{h}" ', 1)
        if 'loading=' not in tag:
            tag = tag.replace('<img ', '<img loading="lazy" decoding="async" ', 1)
        webp = os.path.splitext(src)[0] + '.webp'
        return f'<picture><source srcset="{webp}" type="image/webp">{tag}</picture>'
    return re.sub(r'<img\s[^>]*src="[^":]+\.jpe?g"[^>]*>', repl, html)


# ── Inhalte (Jinja) ──────────────────────────────────────────
def absaetze(text):
    """Mehrzeiliger Text -> <p>-Absätze (Leerzeile = neuer Absatz), sicher escaped."""
    blocks = [b.strip() for b in re.split(r'\n\s*\n', str(text or '')) if b.strip()]
    return Markup('\n'.join(f'<p>{escape(b)}</p>' for b in blocks))


jinja = Environment(autoescape=True, keep_trailing_newline=True)
jinja.filters['absaetze'] = absaetze


def render_content(html, name):
    if name not in CONTENT_FILES:
        return html
    with open(os.path.join(CONTENT, CONTENT_FILES[name]), encoding='utf-8') as f:
        data = json.load(f)
    return jinja.from_string(html).render(**data)


# ── HTML ─────────────────────────────────────────────────────
def mark_current(partial, page):
    return partial.replace(f'href="{page}"', f'href="{page}" aria-current="page"')


def minify_html(html):
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'>\s+<', '> <', html)
    html = re.sub(r'[ \t]*\n\s*', '\n', html)
    return html.strip() + '\n'


def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{};,>])\s*', r'\1', css)
    return css.strip()


def build_html(name, asset_hashes):
    html = render_content(read(os.path.join(SRC, name)), name)
    if PREVIEW:
        html = html.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow">', 1)
    for part in ('head', 'header', 'footer'):
        marker = f'<!-- @include {part} -->'
        if marker in html:
            html = html.replace('    ' + marker, mark_current(read(os.path.join(PARTIALS, part + '.html')), name).rstrip('\n'))
    for asset, h in asset_hashes.items():
        html = html.replace(f'"{asset}"', f'"{asset}?v={h}"')
    html = replace_icons(html)
    html = enhance_images(html)
    return minify_html(html)


def main():
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)

    files = sorted(os.listdir(SRC))

    # 1. Bilder zuerst (Maße werden für das HTML gebraucht)
    for name in files:
        if name.lower().endswith(('.jpg', '.jpeg')):
            process_image(name)

    # 2. CSS / JS
    write(os.path.join(DIST, 'styles.css'), minify_css(read(os.path.join(SRC, 'styles.css'))))
    icons = {n: render_icon(n) for n in SCRIPT_ICONS}
    js = read(os.path.join(SRC, 'script.js')).replace('const ICONS = {};', 'const ICONS = ' + json.dumps(icons) + ';')
    write(os.path.join(DIST, 'script.js'), js)
    asset_hashes = {a: short_hash(os.path.join(DIST, a)) for a in ('styles.css', 'script.js')}

    # 3. Alles andere
    for name in files:
        src = os.path.join(SRC, name)
        if name.startswith('.DS_Store') or name.lower().endswith(('.jpg', '.jpeg')) or name in ('styles.css', 'script.js'):
            continue
        if name.endswith('.html'):
            write(os.path.join(DIST, name), build_html(name, asset_hashes))
        elif os.path.isdir(src):
            shutil.copytree(src, os.path.join(DIST, name))
        else:
            shutil.copy2(src, os.path.join(DIST, name))

    if PREVIEW:
        write(os.path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n')

    leftover = [f for f in os.listdir(DIST) if f.endswith('.html') and '@include' in read(os.path.join(DIST, f))]
    if leftover:
        raise SystemExit(f'Nicht aufgelöste Includes in: {leftover}')

    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(DIST) for f in fs)
    print(f'Build fertig{" (Vorschau)" if PREVIEW else ""}: {len(os.listdir(DIST))} Einträge, {total / 1024 / 1024:.1f} MB in dist/')


if __name__ == '__main__':
    main()
