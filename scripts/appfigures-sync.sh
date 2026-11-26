#!/bin/bash
# Weekly local Appfigures sync for ai-money-playbook, run by launchd (Tuesday 08:00 Europe/Brussels).
# - Uses the official Appfigures CLI (`af`) with the key from the macOS keychain. No MCP is needed,
#   so no MCP profile is activated or changed (nothing to restore).
# - Works in its own clone (never in the shared ~/ai-money-playbook checkout), on branch weekly/appfigures-sync.
# - Never pushes to main. Opens a PR only when rankings changed and tests/build pass.
# - Exclusive lock, one run per ISO week (stamp file), secrets never logged.
# Manual run / recovery: ~/Library/Application\ Support/ai-money-playbook/bin/appfigures-sync.sh --force
set -euo pipefail
umask 077

export TZ="Europe/Brussels"
export PATH="$HOME/.local/share/mise/shims:$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
REPO_SLUG="phlppgdfry/ai-money-playbook"
BRANCH="weekly/appfigures-sync"
STATE_DIR="$HOME/Library/Application Support/ai-money-playbook"
CLONE_DIR="$STATE_DIR/repo"
BIN_DIR="$STATE_DIR/bin"
LOCK_DIR="$STATE_DIR/appfigures-sync.lock"
LOG_DIR="$HOME/Library/Logs/ai-money-playbook"
LOG_FILE="$LOG_DIR/appfigures-sync.log"
WEEK="$(date +%G-W%V)"
STAMP_FILE="$STATE_DIR/appfigures-sync.last-week"
FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p "$STATE_DIR" "$LOG_DIR"
exec >>"$LOG_FILE" 2>&1
log() { printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')" "$WEEK" "$*"; }
notify() { /usr/bin/osascript -e "display notification \"$1\" with title \"AI Money Playbook — Appfigures-sync\"" >/dev/null 2>&1 || true; }

# Exclusive lock (stale locks of dead processes are cleared).
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  if [ -f "$LOCK_DIR/pid" ] && ! kill -0 "$(cat "$LOCK_DIR/pid")" 2>/dev/null; then
    log "Verweesde lock gevonden, wordt opgeruimd."
    rm -rf "$LOCK_DIR"; mkdir "$LOCK_DIR"
  else
    log "Andere run actief: deze run stopt."; exit 0
  fi
fi
echo $$ >"$LOCK_DIR/pid"
on_exit() {
  rc=$?
  rm -rf "$LOCK_DIR"
  if [ $rc -ne 0 ]; then log "MISLUKT (exit $rc). Herstel: los de oorzaak op en draai '$BIN_DIR/appfigures-sync.sh --force'."; notify "Mislukt (exit $rc), zie $LOG_FILE"; fi
}
trap on_exit EXIT

log "Start (force=$FORCE)."
if [ "$FORCE" -eq 0 ] && [ -f "$STAMP_FILE" ] && [ "$(cat "$STAMP_FILE")" = "$WEEK" ]; then
  log "Deze ISO-week is al gesynchroniseerd: niets te doen."; exit 0
fi

APPFIGURES_API_KEY="$(security find-generic-password -s APPFIGURES_API_KEY -w 2>/dev/null || true)"
if [ -z "$APPFIGURES_API_KEY" ]; then log "Keychain-item APPFIGURES_API_KEY ontbreekt of is vergrendeld."; exit 3; fi
export APPFIGURES_API_KEY
af auth status >/dev/null 2>&1 || { log "Appfigures-authenticatie mislukt (af auth status)."; exit 3; }
gh auth status >/dev/null 2>&1 || { log "GitHub CLI niet ingelogd (gh auth status)."; exit 3; }

# Do not overwrite a sync PR that is still waiting for review.
OPEN_PR="$(gh pr list --repo "$REPO_SLUG" --head "$BRANCH" --state open --json number --jq '.[0].number' 2>/dev/null || true)"
if [ -n "$OPEN_PR" ]; then
  log "PR #$OPEN_PR van $BRANCH wacht nog op review: geen nieuwe sync (voorkomt dubbele PR's)."; exit 0
fi

if [ ! -d "$CLONE_DIR/.git" ]; then
  log "Eigen clone aanmaken in $CLONE_DIR."
  git clone --quiet "https://github.com/$REPO_SLUG.git" "$CLONE_DIR"
fi
cd "$CLONE_DIR"
git fetch --quiet --prune origin
git checkout --quiet -B "$BRANCH" origin/main
git reset --quiet --hard origin/main
git clean -fdq

node "$BIN_DIR/appfigures-sync.mjs" "$CLONE_DIR" || { rc=$?; log "Sync-script faalde (exit $rc); niets gecommit."; exit $rc; }

if git diff --quiet -- data; then
  log "Geen wijzigingen: geen PR."; echo "$WEEK" >"$STAMP_FILE"; exit 0
fi

log "Wijzigingen gevonden: tests, schema- en security-validatie."
npm test >/dev/null && npm run build >/dev/null || { log "Tests/validatie mislukt: niets gepusht."; exit 4; }

git add data/niches.json data/evidence.json
git -c user.name="ai-money-playbook appfigures-sync" -c user.email="appfigures-sync@users.noreply.github.com" \
  commit --quiet -m "chore(appfigures): wekelijkse sync eigen portfolio-rankings ($WEEK)"
git push --quiet --force-with-lease origin "$BRANCH"
PR_URL="$(gh pr create --repo "$REPO_SLUG" --base main --head "$BRANCH" \
  --title "Wekelijkse Appfigures-sync ($WEEK)" \
  --body "Automatische lokale sync (launchd, dinsdag 08:00 Europe/Brussels) van de gevolgde keyword-rankings van Hand Mirror, Mirror Mate en RingSizer via de officiële Appfigures-CLI (\`af keywords tracked-ranks\`, US). Deterministisch, geen LLM. Tests, schema- en securityscan geslaagd. Niet automatisch mergen.")"
log "PR aangemaakt: $PR_URL"
echo "$WEEK" >"$STAMP_FILE"
notify "PR aangemaakt: $PR_URL"
