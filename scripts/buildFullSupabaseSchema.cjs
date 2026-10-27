const fs = require('fs');
const path = require('path');

// Latest migration file
const latestMigrationPath = path.join(__dirname, '../supabase/migrations/20261028000001_security_hardening.sql');
const targetSchemaPath = path.join(__dirname, '../supabase/schema.sql');

if (!fs.existsSync(latestMigrationPath)) {
  console.error('Error: Latest migration file not found:', latestMigrationPath);
  process.exit(1);
}

const migrationContent = fs.readFileSync(latestMigrationPath, 'utf8');

// Write byte-identical schema.sql
fs.writeFileSync(targetSchemaPath, migrationContent, 'utf8');

console.log('Successfully synchronized supabase/schema.sql with 20261028000001_security_hardening.sql!');
