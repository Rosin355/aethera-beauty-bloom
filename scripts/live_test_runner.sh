#!/usr/bin/env bash
# Interactive wrapper for scripts/test-tools.sh (Fase 1 live tests, docs/RUN_ON_MAC.md §3b).
# Run this from YOUR MAC in its own terminal. It is never executed in the coding sandbox.
#
# Prompts for credentials at THIS terminal only — nothing is passed through chat, printed back
# in full, or committed. Full output is saved under logs/ (gitignored) for later review.
#
# Rate limit: the function allows 30 requests / minute / user — do not run this twice within
# the same minute.
set -uo pipefail
cd "$(dirname "$0")/.."

mkdir -p logs
TS="$(date +%Y%m%d_%H%M%S)"
LOG="logs/live_test_fase1_${TS}.log"
LATEST="logs/live_test_fase1_latest.log"

echo "=== Fase 1 live tests — $(date) ==="
echo "Repo:   $(pwd)"
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo

read -r -p "SUPABASE_URL (e.g. https://<project-ref>.supabase.co): " SUPABASE_URL
read -r -p "SUPABASE_ANON_KEY (anon/public key, not secret): " SUPABASE_ANON_KEY

echo
echo "Authenticate the test user (ideally the OWNER of a center):"
echo "  1) email + password — this script logs in for you"
echo "  2) paste an existing access token (JWT)"
read -r -p "Choice [1/2]: " AUTH_CHOICE

if [ "$AUTH_CHOICE" = "2" ]; then
  read -r -s -p "ACCESS_TOKEN (input hidden): " ACCESS_TOKEN
  echo
  export ACCESS_TOKEN
else
  read -r -p "TEST_EMAIL: " TEST_EMAIL
  read -r -s -p "TEST_PASSWORD (input hidden): " TEST_PASSWORD
  echo
  export TEST_EMAIL TEST_PASSWORD
fi

echo
echo "Optional extras (press Enter to skip any of them):"
read -r -p "CENTER_ID (needed only if the user belongs to several centers): " CENTER_ID
read -r -p "OTHER_CENTER_ID (a center the user is NOT a member of, expects 403): " OTHER_CENTER_ID
read -r -s -p "OPERATOR_ACCESS_TOKEN (JWT of a non-owner member of CENTER_ID, input hidden): " OPERATOR_ACCESS_TOKEN
echo
read -r -p "GOAL_AMOUNT for simulate_goal [5000]: " GOAL_AMOUNT
read -r -p "Run the natural-language chat round trip? uses model credits [Y/n]: " RUN_CHAT_CHOICE

export SUPABASE_URL SUPABASE_ANON_KEY
[ -n "$CENTER_ID" ] && export CENTER_ID
[ -n "$OTHER_CENTER_ID" ] && export OTHER_CENTER_ID
[ -n "$OPERATOR_ACCESS_TOKEN" ] && export OPERATOR_ACCESS_TOKEN
[ -n "$GOAL_AMOUNT" ] && export GOAL_AMOUNT
case "$RUN_CHAT_CHOICE" in
  [nN]*) export RUN_CHAT=0 ;;
  *) export RUN_CHAT=1 ;;
esac

echo
echo "Rate limit: 30 requests/min/user — do not run this twice within the same minute."
echo "Running ./scripts/test-tools.sh ..."
echo

./scripts/test-tools.sh 2>&1 | tee "$LOG"
STATUS=${PIPESTATUS[0]}
cp "$LOG" "$LATEST"
echo "STATUS=$STATUS" >>"$LATEST"

echo
echo "Exit code: $STATUS"
echo "Full output saved to: $LOG"
echo
read -r -p "Done — press Enter to close this tab."
