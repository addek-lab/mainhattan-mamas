#!/bin/bash
# Lädt den kompletten Inhalt von dist/ per SFTP nach public_html bei Strato.
#
# Zugangsdaten stehen NICHT im Code, sondern in v2/.deploy.env (liegt nicht in Git):
#   SFTP_HOST=<Strato-SSH-Host>
#   SFTP_USER=<Strato-Benutzer>
#   SFTP_PASS=...
#
# Aufruf:
#   ./deploy.sh --dry-run   zeigt nur, was hochgeladen würde
#   ./deploy.sh             baut neu und lädt hoch (mit Rückfrage)
set -euo pipefail
cd "$(dirname "$0")"

.venv/bin/python build.py

if [ "${1:-}" = "--dry-run" ]; then
    echo "Würde hochladen nach public_html:"
    (cd dist && find . -type f | sort)
    exit 0
fi

if [ ! -f .deploy.env ]; then
    echo "Fehlt: v2/.deploy.env mit SFTP_HOST, SFTP_USER, SFTP_PASS" >&2
    exit 1
fi
set -a; source .deploy.env; set +a

read -r -p "dist/ jetzt LIVE nach $SFTP_HOST:public_html hochladen? [j/N] " answer
[ "$answer" = "j" ] || { echo "Abgebrochen."; exit 1; }

# sftp-Befehle: Ordner anlegen (Fehler ignorieren, falls vorhanden), dann alles hochladen
batch=$(mktemp)
trap 'rm -f "$batch"' EXIT
{
    echo "cd public_html"
    (cd dist && find . -mindepth 1 -type d | sed 's|^\./||' | sort | sed 's|^|-mkdir |')
    (cd dist && find . -type f | sed 's|^\./||' | sort | sed 's|.*|put "dist/&" "&"|')
    echo "bye"
} > "$batch"

# sftp im Batch-Modus (-b) erlaubt keine Passworteingabe, daher Befehle per expect einzeln senden
SFTP_BATCH="$batch" expect <<'EOF'
set timeout 900
spawn sftp -o StrictHostKeyChecking=accept-new $env(SFTP_USER)@$env(SFTP_HOST)
expect {
    -re "(?i)password:" { send -- "$env(SFTP_PASS)\r"; exp_continue }
    "sftp>" {}
    timeout { puts "Zeitüberschreitung beim Verbinden"; exit 1 }
}
set f [open $env(SFTP_BATCH)]
while {[gets $f line] >= 0} {
    send -- "$line\r"
    if {$line eq "bye"} { break }
    expect {
        "sftp>" {}
        timeout { puts "Zeitüberschreitung bei: $line"; exit 1 }
    }
}
close $f
expect eof
EOF
echo "Upload abgeschlossen."
