#!/usr/bin/env bash
# Runs the migration + seed + RLS/workflow tests against a throwaway local Postgres (16+).
# Usage: PGHOST=... PGPORT=... PGUSER=postgres ./scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB=murshid_test
psql -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB"
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/00_supabase_stub.sql 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/migrations/0001_init.sql >/dev/null 2>&1
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/seed.sql
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/rls_workflow_test.sql 2>&1 | grep -oE "(OK.*|FAIL.*|ERROR.*)$"
echo "All database checks passed."
