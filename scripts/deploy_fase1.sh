#!/usr/bin/env bash
# Fase 1 deploy: run this from YOUR MAC. It is never executed in the coding sandbox.
#
#   ./scripts/deploy_fase1.sh preflight     # tools + login checks only
#   ./scripts/deploy_fase1.sh migrations    # db push (dry-run first, then asks)
#   ./scripts/deploy_fase1.sh functions     # deploy the edge functions of Fase 1
#   ./scripts/deploy_fase1.sh all           # preflight + migrations + functions (default)
#
# Environment (nothing is hardcoded; the project ref falls back to supabase/config.toml):
#   SUPABASE_PROJECT_REF   optional override of the project ref
#   ASSUME_YES=1           skip the confirmation prompt before `db push`
#
# Order of use is documented in docs/RUN_ON_MAC.md. Each prompt of Fase 1 appends its own
# steps to this file; a step is idempotent and safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="${SUPABASE_PROJECT_REF:-$(sed -n 's/^project_id *= *"\(.*\)"/\1/p' supabase/config.toml | head -n1)}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "ERROR: '$1' not found in PATH" >&2; exit 1; }; }
confirm() {
  [ "${ASSUME_YES:-0}" = "1" ] && return 0
  read -r -p "$1 [y/N] " ans
  [ "$ans" = "y" ] || [ "$ans" = "Y" ]
}

step_preflight() {
  need supabase
  [ -n "$PROJECT_REF" ] || { echo "ERROR: no project ref (set SUPABASE_PROJECT_REF or project_id in supabase/config.toml)" >&2; exit 1; }
  echo "Project ref: $PROJECT_REF"
  supabase --version
  # Fails if you are not logged in (`supabase login`) or do not have access to the project.
  supabase projects list >/dev/null
  git diff --quiet && git diff --cached --quiet || echo "WARNING: working tree has uncommitted changes"
}

step_migrations() {
  supabase link --project-ref "$PROJECT_REF"
  echo "--- pending migrations (dry run) ---"
  supabase db push --dry-run
  confirm "Apply the migrations above to project $PROJECT_REF?" || { echo "Aborted."; exit 1; }
  supabase db push
}

step_functions() {
  supabase functions deploy ai-assistant --project-ref "$PROJECT_REF"
  supabase functions deploy generate-report --project-ref "$PROJECT_REF"
  supabase functions deploy send-push --project-ref "$PROJECT_REF"
}

case "${1:-all}" in
  preflight)  step_preflight ;;
  migrations) step_preflight; step_migrations ;;
  functions)  step_preflight; step_functions ;;
  all)        step_preflight; step_migrations; step_functions ;;
  *) echo "usage: $0 [preflight|migrations|functions|all]" >&2; exit 2 ;;
esac
echo "Done."
