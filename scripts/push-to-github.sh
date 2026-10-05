#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v git >/dev/null 2>&1; then
  echo 'Git is required. Install it from https://git-scm.com/downloads/ and rerun this script.' >&2
  exit 1
fi
if ! command -v gh >/dev/null 2>&1; then
  echo 'Install GitHub CLI from https://cli.github.com/, then run: gh auth login' >&2
  echo 'After signing in, rerun this script.' >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo 'Sign in from your terminal with: gh auth login' >&2
  echo 'Then rerun this script. The app plugin and CLI have separate sign-ins.' >&2
  exit 1
fi

account="$(gh api user --jq '.login')"
repository="$account/job-search-tracker"
# A failed lookup can indicate either a missing repository or a network error.
# The create operation below resolves that distinction without touching existing repos.
if gh repo view "$repository" --json name >/dev/null 2>&1; then
  echo "Repository $repository already exists. Nothing was changed." >&2
  exit 1
fi

upload_dir="$(mktemp -d "${TMPDIR:-/tmp}/job-search-tracker-upload.XXXXXX")"
trap 'rm -rf -- "$upload_dir"' EXIT

# Explicit allowlist: no database, backups, dependencies, build output, or local settings.
for entry in .gitignore README.md VALIDATION.md package.json package-lock.json index.html vite.config.ts tsconfig.json eslint.config.js postcss.config.js tailwind.config.js src server shared docs scripts; do
  if [ ! -e "$project_dir/$entry" ]; then
    echo "Required project entry is missing: $entry" >&2
    exit 1
  fi
  cp -R -- "$project_dir/$entry" "$upload_dir/"
done

# Exclude secrets/backups even if accidentally added inside an allowed source folder.
find "$upload_dir" -type d \( -name .git -o -name .aws -o -name .codex -o -name .agents -o -name node_modules -o -name data \) -prune -exec rm -rf -- {} +
find "$upload_dir" -type f \( -name '.env' -o -name '.env.*' -o -name '*.sqlite*' -o -name '*.backup' -o -name '*.db' -o -name '*.bak' -o -name '*.pem' -o -name '*.key' -o -name '.DS_Store' \) ! -name '.env.example' -delete

git -C "$upload_dir" init -b main >/dev/null
git -C "$upload_dir" config user.name "$account"
email="$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
git -C "$upload_dir" config user.email "$email"
git -C "$upload_dir" add --all
if git -C "$upload_dir" ls-files | grep -Eq '(^|/)(data|node_modules|\.aws|\.codex|\.agents)/|(^|/)\.env$|\.(sqlite|backup|db|bak|pem|key)'; then
  echo 'Upload stopped: an excluded file was found in the staged source.' >&2
  exit 1
fi
if ! git -C "$upload_dir" ls-files docs/ | grep -q 'JOB_SEARCH_TRACKER_BODY_OF_WORK'; then
  echo 'Upload stopped: the body-of-work guide is missing.' >&2
  exit 1
fi

git -C "$upload_dir" commit -m 'Add local job search tracker and beginner build guide' >/dev/null
gh repo create "$repository" --private --description 'Local engineering management job-search CRM with a beginner vibe-coding guide.' --source "$upload_dir" --remote origin --push

private="$(gh repo view "$repository" --json isPrivate --jq '.isPrivate')"
if [ "$private" != 'true' ]; then
  echo 'Repository privacy could not be confirmed. Check GitHub before proceeding.' >&2
  exit 1
fi
local_commit="$(git -C "$upload_dir" rev-parse HEAD)"
remote_commit="$(gh api "repos/$repository/commits/main" --jq '.sha')"
if [ "$local_commit" != "$remote_commit" ]; then
  echo 'Remote commit verification failed. Check GitHub before retrying.' >&2
  exit 1
fi

echo "Uploaded and verified private repository: https://github.com/$repository"
echo 'Includes the app and body-of-work guide. Local data and settings were excluded.'
echo 'This uploaded a clean source snapshot; it did not change this folder’s Git configuration.'
