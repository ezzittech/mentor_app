#!/usr/bin/env bash
# Runs the migration + seed + RLS/workflow tests against a throwaway local Postgres (16+).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres ./scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=murshid_test
psql -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/00_supabase_stub.sql 2>/dev/null
for f in supabase/migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f" >/dev/null 2>&1; done
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/seed.sql
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/rls_workflow_test.sql 2>&1 | grep -oE "(OK.*|FAIL.*|ERROR.*)$"
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/demo_accounts_test.sql 2>&1 | grep -oE "(OK.*|FAIL.*|ERROR.*)$"
psql -q -d $DB -f supabase/verify.sql | grep -E "❌" && { echo "verify.sql reported problems"; exit 1; } || true
echo "All database checks passed."
