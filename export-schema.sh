#!/bin/bash

# RainDr0p Schema Export Script
# This script exports the complete database schema from your Supabase project

echo "================================================"
echo "RainDr0p Database Schema Export"
echo "================================================"
echo ""
echo "To export the complete database schema, you need your database password."
echo ""
echo "Get your database password:"
echo "1. Go to https://supabase.com/dashboard/project/jziiwbxptavdpyfpfhio/settings/database"
echo "2. Click 'Database Settings'"
echo "3. Scroll to 'Connection String' section"
echo "4. Click 'Reset Database Password' (or use existing if you have it)"
echo "5. Copy the password"
echo ""
read -sp "Enter your Supabase database password: " DB_PASSWORD
echo ""
echo ""

# Construct the connection string
PROJECT_REF="jziiwbxptavdpyfpfhio"
DB_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "Exporting schema to supabase/schema.sql..."
echo ""

# Export using pg_dump
pg_dump "$DB_URL" \
  --schema=public \
  --no-owner \
  --no-acl \
  --no-privileges \
  --schema-only \
  --file=supabase/schema.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Schema exported successfully to supabase/schema.sql"
  echo ""

  # Add a header to the schema file
  TEMP_FILE=$(mktemp)
  cat > "$TEMP_FILE" << 'EOF'
-- ============================================================================
-- RainDr0p Database Schema
-- ============================================================================
-- This file contains the complete database schema for the RainDr0p platform
-- Generated from Supabase project: jziiwbxptavdpyfpfhio
--
-- To apply this schema to a new Supabase project:
-- psql "YOUR_DATABASE_CONNECTION_STRING" -f schema.sql
--
-- For setup instructions, see SETUP.md
-- ============================================================================

EOF

  cat supabase/schema.sql >> "$TEMP_FILE"
  mv "$TEMP_FILE" supabase/schema.sql

  echo "Schema file size: $(wc -c < supabase/schema.sql) bytes"
  echo "Tables included: $(grep -c 'CREATE TABLE' supabase/schema.sql)"
  echo "Views included: $(grep -c 'CREATE VIEW' supabase/schema.sql || echo 0)"
  echo "Functions included: $(grep -c 'CREATE FUNCTION' supabase/schema.sql || echo 0)"
  echo ""
else
  echo ""
  echo "❌ Schema export failed. Please check:"
  echo "  - Database password is correct"
  echo "  - pg_dump is installed (run: brew install postgresql or apt-get install postgresql-client)"
  echo "  - Network connection to Supabase"
  echo ""
  exit 1
fi
