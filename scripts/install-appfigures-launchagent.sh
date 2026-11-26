#!/bin/bash
# Installs (or updates) the weekly Appfigures sync as a user LaunchAgent: Tuesday 08:00 local time.
# The Mac's timezone must be Europe/Brussels (checked below); launchd uses local time.
# Uninstall: launchctl bootout gui/$(id -u)/com.phlppgdfry.ai-money-playbook.appfigures-sync
#            && rm ~/Library/LaunchAgents/com.phlppgdfry.ai-money-playbook.appfigures-sync.plist
set -euo pipefail
LABEL="com.phlppgdfry.ai-money-playbook.appfigures-sync"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
BIN_DIR="$HOME/Library/Application Support/ai-money-playbook/bin"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

tz="$(readlink /etc/localtime | sed 's|.*/zoneinfo/||')"
if [ "$tz" != "Europe/Brussels" ]; then
  echo "Systeemtijdzone is '$tz', niet Europe/Brussels: launchd zou op het verkeerde uur draaien." >&2; exit 1
fi

mkdir -p "$BIN_DIR" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs/ai-money-playbook"
install -m 700 "$SRC_DIR/appfigures-sync.sh" "$BIN_DIR/appfigures-sync.sh"
install -m 600 "$SRC_DIR/appfigures-sync.mjs" "$BIN_DIR/appfigures-sync.mjs"

cat >"$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$BIN_DIR/appfigures-sync.sh</string></array>
  <key>StartCalendarInterval</key>
  <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/ai-money-playbook/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/ai-money-playbook/launchd.err.log</string>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
</dict>
</plist>
EOF
chmod 644 "$PLIST"
plutil -lint "$PLIST" >/dev/null

launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Geïnstalleerd: $LABEL (dinsdag 08:00 Europe/Brussels). Testen: launchctl kickstart -k gui/$(id -u)/$LABEL"
