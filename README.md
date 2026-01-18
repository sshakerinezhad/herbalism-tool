# Knights of Belyar Companion

A character tracker for our D&D games. Built for the **Elros Player's Guide** - a 70-page expansion written by my buddy Nick that adds vocations, an elemental magic system, a martial combat overhaul, and more to 5E.

This app is also a love letter to my friend Finn who hates everything about the EPG. Not becuase it ain't fun, but because it's "way too complicated"...

Additionally, the herbalism system described in the **EPG** and implemented here is based on the work of *AeronDrake* & *calculuschild* so thanks to them as well.

---

## What's In Here

```
Character Tracking ──── stats, modifiers, hit dice, coin purse
     │
     ├── Vocations ──── special roles with unique mechanics
     │        │
     │        └── Herbalist (implemented)
     │              foraging, brewing, recipes
     │
     │        └── Blacksmith, Alchemist, Priest... (coming)
     │
     ├── Equipment ──── 12 armor slots, weapon management
     │                  Elden Ring-style weapon switching
     │
     └── Inventory ──── herbs, brewed items, general gear
```

---

## The Herbalism System

The only fully-built vocation right now. Here's how it works:

**Foraging** - Spend sessions searching biomes for herbs. Roll Nature/Survival vs DC 13. Success gets you random herbs weighted by what grows there.

**Herbs** - Each has elements (fire, water, earth, air, positive, negative) and a rarity. The elements determine what you can brew.

**Brewing** - Combine herbs and pair their elements to create:
- **Elixirs** - drink for buffs
- **Bombs** - throw for damage/effects
- **Oils** - coat weapons

**Recipes** - Some known from the start, others are secret (DM hands out unlock codes when you discover them in-game).

Two brewing modes: pick herbs first and see what you can make, or pick a recipe and find matching herbs.

---

## How It Connects

```
┌─────────────────────────────────────────────────────────────┐
│                         Supabase                            │
│                    (Postgres + Auth)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     React Query                             │
│              (caching, prefetching, sync)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      Next.js App                            │
│                                                             │
│   /profile ─── character settings                           │
│   /forage ──── roll for herbs by biome                      │
│   /brew ────── combine herbs into items                     │
│   /inventory ─ manage everything you own                    │
│   /recipes ─── view known recipes, unlock secrets           │
└─────────────────────────────────────────────────────────────┘
```

All data is character-based (not user-based), so multi-character support is possible down the line.

---

## Database Shape

The important bits:

| What | Where | Notes |
|------|-------|-------|
| Character stats | `characters` | 1:1 with auth user for now |
| Herbs owned | `character_herbs` | quantity tracked per herb type |
| Brewed items | `character_brewed` | elixirs, bombs, oils you've made |
| Known recipes | `character_recipes` | includes secret unlocks |
| Reference data | `herbs`, `biomes`, `recipes` | static game rules |

One gotcha: the app calls it `brewingModifier` but the database column is `herbalism_modifier`. Historical reasons.

---

## Getting Started

```bash
npm install

# Set up your env (copy .env.example, add your Supabase keys)
cp .env.example .env.local

npm run dev
```

You'll need a Supabase project. Schema's in `supabase/migrations/`.

```bash
npm run db:types   # Generate TypeScript types
npm run db:push    # Push migrations to remote
```

---

## Tech

Next.js 16, Supabase (Postgres + Auth), React Query, Tailwind v4.

All client-side rendering - real-time updates were easier that way.

---

## What's Coming

**More vocations** - Blacksmith (forge weapons from materials), Alchemist (brew potions from creature essences), Priest (blessings and rituals), Runeseeker (Giant magic), Scholar (knowledge gathering), Spellscribe (scroll crafting).

**The bigger systems** - Archemancy (elemental magic that connects everything), Martial Combat Expansion (weapon make/materials, lingering injuries, combat stances).

Building these further whenever I have time.

---

## For Contributors

Check `docs/`:
- `QUICKREF.md` - imports and patterns
- `CONTRIBUTING.md` - code style
- `ARCHITECTURE.md` - how pieces fit together

---

*Made for the Knights of Belyar. If you somehow stumbled here from the internet - hi, this is a very specific tool for a very specific homebrew system, but you're welcome to poke around.*
