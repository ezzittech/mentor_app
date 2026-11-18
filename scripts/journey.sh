#!/usr/bin/env bash
# End-to-end journey simulation on a throwaway Postgres (same env vars as scripts/test-db.sh).
# Prints OK / GAP / FAIL lines — GAP = product decision or missing feature, FAIL = bug.
set -uo pipefail
cd "$(dirname "$0")/.."
DB=murshid_journey
psql -q -v ON_ERROR_STOP=1 -c "drop database if exists $DB" -c "create database $DB" 2>/dev/null
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/tests/00_supabase_stub.sql 2>/dev/null
for f in supabase/migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d $DB -f "$f" >/dev/null 2>&1; done
psql -q -v ON_ERROR_STOP=1 -d $DB -f supabase/seed.sql
psql -q -d $DB -f supabase/tests/journey_simulation.sql 2>&1 \
  | grep -E "NOTICE:  (OK|GAP|FAIL)|^ --- |ERROR:" \
  | sed -E 's/^psql:[^ ]+ //; s/NOTICE:  //; s/^ (--- .*)$/\n\1/'
