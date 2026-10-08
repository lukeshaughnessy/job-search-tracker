#!/usr/bin/env bash
set -euo pipefail

# Run as the normal account that owns the project, not with sudo.
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
service_name='job-search-tracker.service'
if [[ "$(uname -s)" != Linux ]]; then
  echo 'This installer supports Linux with systemd.' >&2
  exit 1
fi
for dependency in node npm systemctl loginctl; do
  command -v "$dependency" >/dev/null || { echo "Missing dependency: $dependency" >&2; exit 1; }
done
node_binary="$(command -v node)"
database_path="${DB_PATH:-$project_dir/data/tracker.sqlite}"
if [[ "$database_path" != /* ]]; then database_path="$project_dir/$database_path"; fi
# systemd interprets percent specifiers even inside quoted arguments.
unit_quote() {
  local value="$1"
  if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
    echo 'Startup paths cannot contain newlines.' >&2; exit 1
  fi
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//%/%%}"
  printf '"%s"' "$value"
}
print_unit() {
  cat <<UNIT
[Unit]
Description=Job Search Tracker local application
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
WorkingDirectory=$(unit_quote "$project_dir")
ExecStart=$(unit_quote "$node_binary") --import tsx $(unit_quote "$project_dir/server/index.ts")
Environment="NODE_ENV=production"
Environment="PORT=3001"
Environment="SEED_DATA=false"
Environment=$(unit_quote "DB_PATH=$database_path")
Restart=on-failure
RestartSec=5
TimeoutStopSec=20

[Install]
WantedBy=default.target
UNIT
}
if [[ "${1:-}" == --print-unit ]]; then print_unit; exit 0; fi
if [[ $# != 0 ]]; then echo 'Usage: bash scripts/install-autostart.sh [--print-unit]' >&2; exit 1; fi
if [[ "$EUID" == 0 ]]; then echo 'Run this installer as your normal user, without sudo.' >&2; exit 1; fi
if ! systemctl --user show-environment >/dev/null; then
  echo 'Run this installer from a terminal on your computer, where your systemd user session is available.' >&2
  exit 1
fi
cd "$project_dir"
if [[ ! -d node_modules ]]; then npm ci; fi
npm run build
current_user="$(id -un)"
# Lingering starts the user service manager at boot, even before login.
if [[ "$(loginctl show-user "$current_user" -p Linger --value)" != yes ]]; then
  if ! loginctl enable-linger "$current_user"; then
    echo 'Administrator permission is needed to start this service before login.'
    sudo loginctl enable-linger "$current_user"
  fi
fi
if [[ "$(loginctl show-user "$current_user" -p Linger --value)" != yes ]]; then
  echo 'Boot startup could not be enabled: user lingering remains disabled.' >&2
  exit 1
fi
unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
mkdir -p "$unit_dir"
print_unit > "$unit_dir/$service_name"
systemctl --user daemon-reload
systemctl --user enable "$service_name"
systemctl --user restart "$service_name"
# Wait for startup, then verify the service remains active and serves the UI/API.
node --input-type=module <<'JS'
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
for (let attempt = 0; attempt < 15; attempt++) {
  try {
    const [api, ui] = await Promise.all([
      fetch('http://127.0.0.1:3001/api/data', { signal: AbortSignal.timeout(1000) }),
      fetch('http://127.0.0.1:3001/', { signal: AbortSignal.timeout(1000) })
    ]);
    if (api.ok && ui.ok && (await api.json()).jobs && (await ui.text()).includes('<html')) {
      await delay(1000);
      process.exit(0);
    }
  } catch { /* give the service a moment to start */ }
  await delay(500);
}
console.error('The app did not become healthy. Check: journalctl --user -u job-search-tracker.service -n 50');
console.error('If port 3001 is occupied by a manual npm start/dev session, stop that session and rerun this installer.');
process.exit(1);
JS
systemctl --user is-enabled "$service_name"
systemctl --user is-active "$service_name"
echo 'Boot startup verified: enabled service, active app, and user lingering enabled.'
echo 'Open http://127.0.0.1:3001 — the app runs without a terminal or browser open.'
echo 'After future changes: npm run build && systemctl --user restart job-search-tracker.service'
