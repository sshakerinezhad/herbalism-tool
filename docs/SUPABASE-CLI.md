# Supabase CLI Setup

This project is configured to use the Supabase CLI for database management and type generation.

## Prerequisites

The Supabase CLI is installed as a dev dependency. All commands use `npx supabase` or the npm scripts.

## Authentication

### Step 1: Generate an Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name like "herbalism-tool-dev"
4. Copy the token (starts with `sbp_`)

### Step 2: Set the Environment Variable

Add to your `.env.local` file:

```
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```

Or set it in your shell:

```powershell
# PowerShell
$env:SUPABASE_ACCESS_TOKEN="sbp_your_token_here"

# Or permanently in PowerShell profile
[Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "sbp_your_token_here", "User")
```

### Step 3: Link the Project

```bash
npx supabase link --project-ref cliiijgqzwkiknukfgqc
```

## Project Reference

- **Project ID**: `cliiijgqzwkiknukfgqc`
- **API URL**: `https://cliiijgqzwkiknukfgqc.supabase.co`

## Available Commands

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run db:status` | Show table sizes and stats |
| `npm run db:pull` | Pull remote schema changes to local migrations |
| `npm run db:push` | Push local migrations to remote database |
| `npm run db:diff` | Generate a migration from schema changes |
| `npm run db:reset` | Reset local database (warning: destructive) |
| `npm run db:types` | Generate TypeScript types from database schema |
| `npm run supabase` | Run any supabase CLI command |

### Direct CLI Commands

```bash
# List all tables with stats
npx supabase inspect db table-stats

# Show index sizes
npx supabase inspect db index-sizes

# Generate TypeScript types
npx supabase gen types typescript --project-id cliiijgqzwkiknukfgqc

# Pull remote schema
npx supabase db pull

# Push migrations
npx supabase db push

# Create a new migration
npx supabase migration new my_migration_name

# List migrations
npx supabase migration list

# Execute SQL directly
npx supabase db execute --sql "SELECT * FROM profiles LIMIT 5"
```

## For AI Agents

When working with this codebase, agents can use these commands to understand the database:

```bash
# View all tables and their sizes
npx supabase inspect db table-stats

# View table record counts
npx supabase inspect db table-record-counts

# Generate fresh types
npm run db:types

# Run arbitrary SQL queries
npx supabase db execute --sql "YOUR SQL HERE"
```

## Generated TypeScript Types

Running `npm run db:types` generates `src/lib/database.types.ts` with full type definitions for all tables. This file includes:

- `Row` types for SELECT queries
- `Insert` types for INSERT operations  
- `Update` types for UPDATE operations
- Relationship metadata

Example usage:

```typescript
import { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type NewCharacter = Database['public']['Tables']['characters']['Insert']
```

**Note:** The project also has manual types in `src/lib/types.ts` with domain-specific names and additional computed types. Use whichever fits your needs.

## Database Schema

The database schema is defined in `supabase/migrations/`. Key tables:

### Legacy Herbalism Tables
- `profiles` - User profiles (links to auth.uid())
- `herbs` - Herb reference data
- `biomes` - Biome reference data  
- `biome_herbs` - Herb availability by biome
- `recipes` - Brewing recipes
- `user_inventory` - User's collected herbs
- `user_brewed` - User's brewed items
- `user_recipes` - User's discovered recipes

### Knights of Belyar Tables
- `characters` - Core character data (1:1 with auth.users)
- `skills` - Skill reference table
- `armor_slots` - Armor slot reference table
- `character_skills` - Character skill proficiencies
- `character_armor` - Equipped armor
- `character_weapons` - Character weapons
- `character_items` - Character inventory

## Migrations

All migrations are in `supabase/migrations/` and are numbered sequentially:

1. `001_characters_foundation.sql` - Base character tables
2. `002_seed_reference_data.sql` - Initial reference data
3. `003_rls_policies.sql` - Row Level Security
4. `004_equipment_slots.sql` - Equipment slot system
5. `005_quick_slots_brewed_items.sql` - Quick slots
6. `006_seed_equipment_data.sql` - Equipment data
7. `007_equipment_reference_tables.sql` - Equipment references

To create a new migration:

```bash
npx supabase migration new descriptive_name
```

This creates a new file in `supabase/migrations/` that you can edit.

## Troubleshooting

### Windows: "unexpected character" error in .env.local

If you see `failed to parse environment file: .env.local (unexpected character...)`, your .env.local file has encoding issues (likely UTF-16 or BOM). Fix by:

1. Set the token in PowerShell instead:
   ```powershell
   $env:SUPABASE_ACCESS_TOKEN = "sbp_your_token"
   npx supabase <command>
   ```

2. Or recreate the file with proper encoding:
   ```powershell
   # Read content, strip non-ASCII, save as ASCII
   Get-Content .env.local | ForEach-Object { $_ -replace '[^\x00-\x7F]', '' } | Out-File .env.local -Encoding ASCII
   ```

### "Invalid access token format"

Ensure your token starts with `sbp_` and is set correctly in `SUPABASE_ACCESS_TOKEN`.

