#!/usr/bin/env bash
# Commit (optional), push, and deploy Interviewer stack to production.
#
# Usage:
#   ./scripts/deploy.sh -m "Your commit message"     # commit, push, deploy
#   ./scripts/deploy.sh                             # deploy current origin/main only
#   ./scripts/deploy.sh --remote-only               # same as above
#   ./scripts/deploy.sh -m "msg" --no-deploy        # commit + push only
#   ./scripts/deploy.sh --help
#
# Environment overrides:
#   INTERVIEWER_SSH          SSH target (default: root@187.127.147.191)
#   INTERVIEWER_REMOTE_DIR   App path on server (default: /var/www/interviewer)
#   INTERVIEWER_BRANCH       Git branch (default: main)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

INTERVIEWER_SSH="${INTERVIEWER_SSH:-root@187.127.147.191}"
INTERVIEWER_REMOTE_DIR="${INTERVIEWER_REMOTE_DIR:-/var/www/interviewer}"
INTERVIEWER_BRANCH="${INTERVIEWER_BRANCH:-main}"

DO_COMMIT=0
DO_PUSH=0
DO_DEPLOY=1
DO_MIGRATE=1
COMMIT_MSG=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Interviewer deploy script — commit, push, migrate, build, reload PM2.

Options:
  -m, --message MSG   Commit all changes with this message (enables commit + push)
  -c, --commit MSG    Alias for --message
      --no-commit     Skip local commit even if there are changes
      --no-push       Skip git push (use with -m for local commit only)
      --no-deploy     Skip remote SSH deploy
      --no-migrate    Skip prisma migrate deploy on server
      --remote-only   Deploy only (default when -m is omitted)
      --dry-run       Print commands without executing
  -h, --help          Show this help

Examples:
  ./scripts/deploy.sh -m "Fix logo upload issue"
  ./scripts/deploy.sh
  INTERVIEWER_SSH=root@187.127.147.191 ./scripts/deploy.sh -m "Update landing UI"

Remote steps (on server):
  git fetch && reset --hard origin/main
  npm install (backend, job-seeker, company)
  prisma generate && prisma migrate deploy
  npm run build (backend, job-seeker, company)
  pm2 reload deploy/ecosystem.config.cjs
  health check
EOF
}

log() { printf '\033[1;36m→\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; }
ok() { printf '\033[1;32m✓\033[0m %s\n' "$*"; }

run() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] $*"
  else
    log "$*"
    "$@"
  fi
}

run_ssh() {
  local remote_script="$1"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    log "[dry-run] ssh $INTERVIEWER_SSH <<REMOTE"
    printf '%s\n' "$remote_script"
    log "REMOTE"
  else
    log "SSH deploy → $INTERVIEWER_SSH"
    ssh -o BatchMode=yes "$INTERVIEWER_SSH" "bash -s" <<EOF
set -euo pipefail
$remote_script
EOF
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message|-c|--commit)
      COMMIT_MSG="${2:?Missing commit message after $1}"
      DO_COMMIT=1
      DO_PUSH=1
      shift 2
      ;;
    --no-commit) DO_COMMIT=0; shift ;;
    --no-push) DO_PUSH=0; shift ;;
    --no-deploy) DO_DEPLOY=0; shift ;;
    --no-migrate) DO_MIGRATE=0; shift ;;
    --remote-only) DO_COMMIT=0; DO_PUSH=0; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  err "Not a git repository: $ROOT"
  exit 1
fi

# Auto-enable commit when message provided
if [[ -n "$COMMIT_MSG" ]]; then
  DO_COMMIT=1
  DO_PUSH=1
fi

HAS_CHANGES=0
if ! git diff --quiet || ! git diff --cached --quiet || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
  HAS_CHANGES=1
fi

if [[ "$HAS_CHANGES" -eq 1 && "$DO_COMMIT" -eq 0 && "$DO_DEPLOY" -eq 1 ]]; then
  warn "You have uncommitted changes. Deploy will use origin/$INTERVIEWER_BRANCH, not local files."
  warn "Pass -m \"message\" to commit and push first, or use --no-deploy."
fi

if [[ "$DO_COMMIT" -eq 1 ]]; then
  if [[ -z "$COMMIT_MSG" ]]; then
    err "Commit message required. Use: ./scripts/deploy.sh -m \"Your message\""
    exit 1
  fi
  if [[ "$HAS_CHANGES" -eq 0 ]]; then
    warn "Nothing to commit."
  else
    run git add -A
    run git commit -m "$COMMIT_MSG"
    ok "Committed"
  fi
fi

if [[ "$DO_PUSH" -eq 1 ]]; then
  if git rev-parse "@{u}" >/dev/null 2>&1; then
    AHEAD="$(git rev-list --count "@{u}..HEAD" 2>/dev/null || echo 0)"
  else
    AHEAD="$(git rev-list --count "origin/$INTERVIEWER_BRANCH..HEAD" 2>/dev/null || echo 0)"
  fi
  if [[ "${AHEAD:-0}" -gt 0 ]] || [[ "$DO_COMMIT" -eq 1 && "$HAS_CHANGES" -eq 1 ]]; then
    run git push -u origin "HEAD:$INTERVIEWER_BRANCH"
    ok "Pushed to origin/$INTERVIEWER_BRANCH"
  else
    log "Branch already up to date with remote — skip push"
  fi
fi

if [[ "$DO_DEPLOY" -eq 0 ]]; then
  ok "Done (no remote deploy)."
  exit 0
fi

MIGRATE_CMD=""
if [[ "$DO_MIGRATE" -eq 1 ]]; then
  MIGRATE_CMD=$'echo "→ Generate Prisma & Run database migrations"\nnpx prisma generate\nnpx prisma migrate deploy\n'
fi

REMOTE_SCRIPT=$(cat <<EOF
cd $INTERVIEWER_REMOTE_DIR
echo "→ Fetch origin/$INTERVIEWER_BRANCH"
git fetch origin
git reset --hard "origin/$INTERVIEWER_BRANCH"

echo "→ Building Backend API"
cd backend
npm install
${MIGRATE_CMD}npm run build

echo "→ Building Job Seeker Frontend"
cd ../job-seeker-frontend
npm install
NEXT_PUBLIC_API_URL=https://api.interviewer.stibe.in npm run build

echo "→ Building Company Frontend"
cd ../company-frontend
npm install
NEXT_PUBLIC_API_URL=https://api.interviewer.stibe.in npm run build

echo "→ Reload PM2 configuration"
cd ..
pm2 startOrReload deploy/ecosystem.config.cjs --update-env

echo "→ PM2 status check"
pm2 status interviewer-backend interviewer-job-seeker interviewer-company

echo "→ Deployed commit details"
git log -1 --oneline

echo "→ Health checking Services"
curl -sf http://127.0.0.1:8040/ || echo "Backend check failed"
curl -sf -o /dev/null -w "Job Seeker Web status: %{http_code}\n" http://127.0.0.1:3040/login || echo "Job Seeker Web check failed"
curl -sf -o /dev/null -w "Company Web status: %{http_code}\n" http://127.0.0.1:3041/login || echo "Company Web check failed"
EOF
)

run_ssh "$REMOTE_SCRIPT"
ok "Deploy complete → https://interviewer.stibe.in"
