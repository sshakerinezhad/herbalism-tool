# Wave 1: Herbalism + Character + Weapon Clusters (Bugs 1-13) Implementation Plan ✅ COMPLETE

> **Completed 2026-03-10.** All 18 tasks done, all 5 checkpoints passed, build clean. Migration 011 pushed to Supabase. `versatile_dice` fully wired up in post-completion fix session (2026-03-11).

**Goal:** Fix 7 herbalism bugs, migrate profile modifiers to computed values, fix 4 character management bugs, and fix weapon schema + add weapon editing.

**Architecture:** Replace 4 stored `Profile` fields (`isHerbalist`, `foragingModifier`, `brewingModifier`, `maxForagingSessions`) with pure functions that compute from character stats, skills, and vocation. This eliminates the "modifier is wrong" bug class entirely. Individual bugs are fixed alongside this migration.

**Tech Stack:** Next.js 16 (App Router, client components), Supabase, React Query, Tailwind CSS v4

---

## Execution Groups

| Group | Tasks | What | Why grouped |
|-------|-------|------|-------------|
| **A** | 1-2 | Foundation + trivial fix | ✅ COMPLETE — Checkpoint A passed |
| **B** | 3-6 | Modifier migration | ✅ COMPLETE — Checkpoint B passed |
| **C** | 7-10 | Bug fixes + Add Herbs | ✅ COMPLETE — Checkpoint C passed |
| **D** | 11-14 | Character management | ✅ COMPLETE — Checkpoint D passed |
| **E** | 15-18 | Weapon system | ✅ COMPLETE — Checkpoint E passed |

**Execute in order: A → B → C → D → E.** Build-verify between groups. If a group fails, fix before moving on.

---

> **⛔ MANDATORY VERIFICATION PROTOCOL — READ THIS BEFORE TOUCHING ANY TASK**
>
> Every task below has a **Verify** field with exact test commands from `__verify__/`.
> The full mapping lives in `__verify__/task_map.json`.
>
> **The rules are non-negotiable:**
>
> 1. After implementing a task, run its **Verify** command(s).
> 2. If ANY test FAILS (non-zero exit) → the task is **FAILED**. Fix your implementation. Do NOT move on.
> 3. If a task has a checkpoint → run it AFTER task tests pass. Checkpoint failure = entire block is broken. STOP.
> 4. You may NOT modify, skip, or weaken any test in `__verify__/`. They are **immutable acceptance criteria**.
> 5. A task is COMPLETE only when ALL its verify tests exit 0. No exceptions.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/characterUtils.ts` | **Create** | Pure utility functions for computing modifiers |
| `src/lib/brewing.ts` | Modify L46 | Fix error message text |
| `src/app/forage/page.tsx` | Modify | Replace profile modifiers with computed values |
| `src/components/forage/SetupPhase.tsx` | Modify | Accept `maxForagingSessions` as direct prop |
| `src/app/brew/page.tsx` | Modify | Replace `profile.brewingModifier` with computed value |
| `src/app/page.tsx` | Modify | Replace profile modifier display with computed values |
| `src/app/profile/page.tsx` | Modify L484-563 | Replace editable inputs with computed read-only display |
| `src/lib/types.ts` | Modify L65-76 | Strip Profile to just `{ name: string }` |
| `src/lib/profile.tsx` | Modify | Update DEFAULT_PROFILE |
| `src/lib/profiles.ts` | Modify | Remove mapping for deleted fields |
| `src/lib/db/characters.ts` | Modify L35-40 | Add `vocation` to CharacterUpdate type |
| `src/app/edit-character/page.tsx` | Modify | Add vocation dropdown |
| `src/components/brew/PairingPhase.tsx` | Modify | Track selection by index, add deselect |
| `src/components/inventory/herbalism/HerbalismSection.tsx` | Modify | Optimistic delete + Add Herbs button |
| `src/components/inventory/herbalism/AddHerbModal.tsx` | **Create** | Modal for adding herbs manually |
| `src/components/inventory/herbalism/index.ts` | Modify | Export AddHerbModal |
| `src/lib/db/characterInventory.ts` | Modify | Add `fetchAllHerbs()` |
| `src/lib/hooks/queries.ts` | Modify | Add `useAllHerbs()` hook |
| `supabase/migrations/011_weapon_self_contained.sql` | **Create** | Add range/versatile columns, backfill template data |
| `src/lib/database.types.ts` | Regenerate | Reflect new columns (`npm run db:types` after migration push) |
| `src/lib/types.ts` | Modify L247-267 | Fix `properties` type, add range + versatile fields |
| `src/lib/db/characters.ts` | Modify L1046-1061 | Copy all template data in `addWeaponFromTemplate` |
| `src/lib/db/characters.ts` | Add after L1134 | New `updateCharacterWeapon()` function |
| `src/components/inventory/equipment/WeaponCard.tsx` | Modify | Read `weapon.properties` directly, show range, add edit button |
| `src/components/inventory/modals/AddWeaponModal.tsx` | Modify L398-420 | Add helper label to range fields |
| `src/components/inventory/modals/EditWeaponModal.tsx` | **Create** | Modal for editing weapon fields |
| `src/components/inventory/modals/index.ts` | Modify | Export EditWeaponModal |
| `src/components/inventory/equipment/WeaponsTab.tsx` | Modify | Wire up edit modal state |
| `src/components/ui/ItemTooltip.tsx` | Modify L35, L296-307 | Handle `string[]` properties (weapons) alongside `Record` (armor) |
| `src/components/character/WeaponSlotCard.tsx` | Modify L206 | Cast properties for ItemTooltip compatibility |

---

## Chunk 1: Foundation + Trivial Fixes (Tasks 1-2) ✅ COMPLETE

### Task 1: Create `characterUtils.ts` ✅

**Files:**
- Create: `src/lib/characterUtils.ts`
- **Verify**: `bash __verify__/tests/01_char_utils_created.sh`

- [ ] **Step 1: Create utility file with 4 pure functions**

```ts
import { getAbilityModifier, getProficiencyBonus } from './constants'

export function computeSkillModifier(
  abilityScore: number,
  level: number,
  isProficient: boolean,
  isExpertise: boolean
): number {
  let mod = getAbilityModifier(abilityScore)
  if (isProficient) mod += getProficiencyBonus(level)
  if (isExpertise) mod += getProficiencyBonus(level)
  return mod
}

export function computeForagingModifier(
  intScore: number,
  level: number,
  natureSkill: { is_proficient: boolean; is_expertise: boolean } | null
): number {
  if (!natureSkill) return getAbilityModifier(intScore)
  return computeSkillModifier(intScore, level, natureSkill.is_proficient, natureSkill.is_expertise)
}

export function computeBrewingModifier(
  intScore: number,
  level: number,
  isHerbalist: boolean
): number {
  const intMod = getAbilityModifier(intScore)
  return isHerbalist ? intMod + getProficiencyBonus(level) : intMod
}

export function computeMaxForagingSessions(intScore: number): number {
  return Math.max(1, getAbilityModifier(intScore))
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**
`git commit -m "feat: add characterUtils with computed modifier functions"`

---

### Task 2: Bug 4 — Fix brewing error message ✅

**Files:**
- Modify: `src/lib/brewing.ts:46`
- **Verify**: `bash __verify__/tests/02_brew_error_message.sh`
- **Checkpoint**: `bash __verify__/checkpoint_A.sh` — MUST pass before proceeding to Group B

- [ ] **Step 1: Change error string**

```diff
- error: 'Cannot mix elixirs and bombs in one brew'
+ error: 'Cannot mix multiple types in one brew'
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**
`git commit -m "fix: correct brew type mixing error message"`

---

## Chunk 2: Modifier Migration (Tasks 3-6) ✅ COMPLETE

The core architectural change. Bugs 5 and 6 are fixed as part of this.

### Task 3: Bug 6 — Max foraging sessions from INT modifier

**Files:**
- Modify: `src/app/forage/page.tsx` (line 59)
- Modify: `src/components/forage/SetupPhase.tsx` (props type)
- **Verify**: `bash __verify__/tests/03_forage_sessions_computed.sh`

- [ ] **Step 1: Update SetupPhase props**

Change the `profile` prop type from `{ name: string; maxForagingSessions: number }` to just `{ name: string }` and add a separate `maxForagingSessions: number` prop. Update the usage at line 69 from `profile.maxForagingSessions` to `maxForagingSessions`.

- [ ] **Step 2: Update forage page**

Import `computeMaxForagingSessions` from `@/lib/characterUtils`. Replace:
```ts
// OLD (line 59)
const sessionsRemaining = Math.max(0, profile.maxForagingSessions - sessionsUsedToday)

// NEW
const maxForagingSessions = computeMaxForagingSessions(character.int)
const sessionsRemaining = Math.max(0, maxForagingSessions - sessionsUsedToday)
```

Pass `maxForagingSessions={maxForagingSessions}` to SetupPhase separately from profile.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**
`git commit -m "fix: compute max foraging sessions from INT modifier"`

---

### Task 4: Bug 5 — Foraging modifier from Nature skill check

**Files:**
- Modify: `src/app/forage/page.tsx` (line 60)
- **Verify**: `bash __verify__/tests/04_forage_modifier_computed.sh`

- [ ] **Step 1: Add skills hook and compute modifier**

Import `useCharacterSkills` from `@/lib/hooks` and `computeForagingModifier` from `@/lib/characterUtils`.

```ts
const { data: characterSkills = [], isLoading: skillsLoading } = useCharacterSkills(character?.id ?? null)

// After loading gate (add skillsLoading to the existing gate)
const natureSkill = characterSkills.find(s => s.skill.name.toLowerCase() === 'nature') ?? null
const foragingMod = computeForagingModifier(character.int, character.level, natureSkill)
```

Remove: `const foragingMod = profile.foragingModifier`

Add `skillsLoading` to the existing loading gate for the skeleton.

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**
`git commit -m "fix: compute foraging modifier from Nature skill check"`

---

### Task 5: Brew page modifier migration

**Files:**
- Modify: `src/app/brew/page.tsx`
- **Verify**: `bash __verify__/tests/05_brew_modifier_computed.sh`

- [ ] **Step 1: Replace profile.brewingModifier**

Import `computeBrewingModifier` from `@/lib/characterUtils`. After the character null-gate (line 327), compute:

```ts
const brewingMod = computeBrewingModifier(character.int, character.level, character.vocation === 'herbalist')
```

Replace all ~6 references to `profile.brewingModifier` with `brewingMod`.

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**
`git commit -m "fix: compute brewing modifier from character data"`

---

### Task 6: Home page + Profile page migration + Profile type cleanup

**Files:**
- Modify: `src/app/page.tsx` (lines 91-95)
- Modify: `src/app/profile/page.tsx` (lines 484-563)
- Modify: `src/lib/types.ts` (lines 65-76)
- Modify: `src/lib/profile.tsx`
- Modify: `src/lib/profiles.ts`
- **Verify**: `bash __verify__/tests/06_profile_stripped.sh`
- **Checkpoint**: `bash __verify__/checkpoint_B.sh` — MUST pass before proceeding to Group C

This is the largest task because the Profile type change cascades.

- [ ] **Step 1: Migrate home page modifiers**

The home page already has `character` via `useCharacter()`. Add `useCharacterSkills(character?.id ?? null)` to compute foraging modifier. Compute brewing modifier directly. Replace `profile.foragingModifier` and `profile.brewingModifier` display with computed values.

Note: Home page already derives `isHerbalist` from `character?.vocation` (line 18) — no change needed there.

- [ ] **Step 2: Migrate profile page herbalism section**

The profile page already has `characterSkills` in scope (line 375). Replace the manual input fields (lines 497-543) with **read-only computed displays** showing the breakdown:

```tsx
{/* Instead of editable inputs, show computed values */}
<div className="flex justify-between items-center">
  <span className="text-vellum-300">Max Foraging Sessions</span>
  <span className="text-vellum-100 font-medium">{computeMaxForagingSessions(character.int)}</span>
</div>
<p className="text-vellum-400 text-xs">Based on INT modifier (minimum 1)</p>
```

Same pattern for foraging modifier and brewing modifier. Keep the Long Rest button as-is (it manages localStorage, unaffected).

Remove `profile.isHerbalist`, `profile.maxForagingSessions`, `profile.foragingModifier`, `profile.brewingModifier` from the component's props type (lines 357-362). The component already derives `isHerbalist` from `character.vocation` (line 371).

- [ ] **Step 3: Strip Profile type**

In `src/lib/types.ts`, change:
```ts
export type Profile = {
  name: string
}
```

In `src/lib/profile.tsx`, update DEFAULT_PROFILE to `{ name: '' }`.

In `src/lib/profiles.ts`, remove mapping for the 4 deleted fields from `mapDatabaseToProfile()`, `createProfile()`, and `updateProfile()`.

- [ ] **Step 4: Fix cascading type errors**

Run `npm run build`. TypeScript will flag every remaining reference to deleted Profile fields. Fix each one. Expected locations:
- Any component still reading `profile.isHerbalist` (should be few — most derive from character.vocation already)
- `updateProfile()` calls that pass the removed fields (profile page had these)
- Any type annotations that spread Profile

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS with zero type errors

- [ ] **Step 6: Commit**
`git commit -m "refactor: remove stored modifiers from Profile, compute from character data"`

---

## Chunk 3: Isolated Bug Fixes (Tasks 7-9) ✅ COMPLETE

### Task 7: Bug 1 — Vocation editing

**Files:**
- Modify: `src/lib/db/characters.ts:35-40` (CharacterUpdate type)
- Modify: `src/app/edit-character/page.tsx`
- **Verify**: `bash __verify__/tests/07_vocation_editing.sh`

- [ ] **Step 1: Add vocation to CharacterUpdate**

In `src/lib/db/characters.ts`, add `'vocation'` to the Pick union in CharacterUpdate type.

- [ ] **Step 2: Add vocation to edit form**

In `src/app/edit-character/page.tsx`:

1. Import `VOCATIONS` from `@/lib/constants` and `Vocation` type from `@/lib/types`
2. Add `vocation: Vocation | null` to `EditableFields` type (line 36)
3. Initialize `vocation: data.vocation` in form state
4. Include `vocation: form.vocation` in save payload
5. Add vocation dropdown in the Basic Info section (after Level):

```tsx
<div>
  <label className="block text-sm font-medium text-zinc-400 mb-2">Vocation</label>
  <select
    value={form.vocation || ''}
    onChange={(e) => updateField('vocation', (e.target.value || null) as Vocation | null)}
    className="w-full max-w-md px-4 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-100"
  >
    <option value="">None</option>
    {Object.entries(VOCATIONS).map(([key, voc]) => (
      <option key={key} value={key}>{voc.name}</option>
    ))}
  </select>
  <p className="text-xs text-zinc-500 mt-1">Herbalist vocation enables brewing.</p>
</div>
```

6. Remove vocation from the "Character Identity (Fixed)" read-only display section.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**
`git commit -m "feat: add vocation editing to edit-character page"`

---

### Task 8: Bug 2 — PairingPhase element selection fix

**Files:**
- Modify: `src/components/brew/PairingPhase.tsx`
- **Verify**: `bash __verify__/tests/08_pairing_index_selection.sh`

- [ ] **Step 1: Switch from name-based to index-based selection**

Replace `selectedFirst: string | null` with `selectedFirstIdx: number | null`.

Replace `handleElementClick`:
```ts
function handleElementClick(idx: number) {
  if (selectedFirstIdx === null) {
    setSelectedFirstIdx(idx)
  } else if (selectedFirstIdx === idx) {
    setSelectedFirstIdx(null)  // deselect
  } else {
    onAddPair(remainingArray[selectedFirstIdx], remainingArray[idx])
    setSelectedFirstIdx(null)
  }
}
```

Update all references:
- Button `onClick`: `onClick={() => handleElementClick(idx)}`
- Highlight: `selectedFirstIdx === idx` (replaces indexOf logic)
- Header display: `remainingArray[selectedFirstIdx]`
- Cancel button: `selectedFirstIdx !== null`
- Recipe preview: use `remainingArray[selectedFirstIdx]`

Add `useEffect` to reset selection when `remainingElements` changes (prevents stale index after pair add/remove):
```ts
useEffect(() => { setSelectedFirstIdx(null) }, [remainingElements])
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**
`git commit -m "fix: track element selection by index in PairingPhase"`

---

### Task 9: Bug 3 — Herb deletion UI fix

**Files:**
- Modify: `src/components/inventory/herbalism/HerbalismSection.tsx`
- **Verify**: `bash __verify__/tests/09_herb_optimistic_delete.sh`

- [ ] **Step 1: Add optimistic cache update**

Import `useQueryClient` from `@tanstack/react-query` and `queryKeys` from `@/lib/hooks/queries`.

After successful `removeCharacterHerbs()`, add optimistic update before calling `onHerbsChanged()`:
```ts
queryClient.setQueryData(
  queryKeys.characterHerbs(characterId),
  (old: CharacterHerb[] | undefined) => {
    if (!old) return old
    return old
      .map(h => h.herb_id === herbId ? { ...h, quantity: h.quantity - 1 } : h)
      .filter(h => h.quantity > 0)
  }
)
onHerbsChanged()  // also invalidate for fresh server data
```

Apply same pattern to `handleDeleteAllOfHerb`.

Note: Need to verify the `CharacterHerb` type shape has `herb_id` and `quantity` fields — check `types.ts` during implementation.

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**
`git commit -m "fix: optimistic UI update for herb deletion"`

---

## Chunk 4: Add Herbs Feature (Task 10) ✅ COMPLETE

### Task 10: Bug 7 — Add herbs without foraging

**Files:**
- Modify: `src/lib/db/characterInventory.ts`
- Modify: `src/lib/hooks/queries.ts`
- Create: `src/components/inventory/herbalism/AddHerbModal.tsx`
- Modify: `src/components/inventory/herbalism/index.ts`
- Modify: `src/components/inventory/herbalism/HerbalismSection.tsx`
- **Verify**: `bash __verify__/tests/10_add_herb_feature.sh`
- **Checkpoint**: `bash __verify__/checkpoint_C.sh` — MUST pass before proceeding to Group D

- [ ] **Step 1: Add data layer**

In `src/lib/db/characterInventory.ts`, add:
```ts
export async function fetchAllHerbs(): Promise<{ data: Herb[] | null; error: string | null }> {
  const { data, error } = await supabase.from('herbs').select('*').order('name')
  if (error) return { data: null, error: error.message }
  return { data: data as Herb[], error: null }
}
```

- [ ] **Step 2: Add React Query hook**

In `src/lib/hooks/queries.ts`:
1. Add `allHerbs: ['allHerbs'] as const` to queryKeys
2. Add fetcher using `fetchAllHerbs`
3. Add `useAllHerbs()` hook with 30min staleTime (reference data)

- [ ] **Step 3: Create AddHerbModal component**

Create `src/components/inventory/herbalism/AddHerbModal.tsx`:
- Self-contained modal with search/filter, herb list, quantity selector
- Uses `useAllHerbs()` internally for herb data
- Calls `addCharacterHerbs()` on submit
- Calls `onSuccess` callback (parent invalidates cache)
- Stays open after adding for multi-add workflow
- Follow existing modal patterns in the codebase

Props: `{ characterId: string; onClose: () => void; onSuccess: () => void }`

- [ ] **Step 4: Export from barrel**

Add `export { AddHerbModal } from './AddHerbModal'` to `src/components/inventory/herbalism/index.ts`.

- [ ] **Step 5: Integrate into HerbalismSection**

Add `showAddHerb` state. Add "+" / "Add Herbs" button in the herbs tab header. Render `<AddHerbModal>` conditionally when open, passing `characterId` and `onSuccess={() => onHerbsChanged()}`.

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**
`git commit -m "feat: add AddHerbModal for manual herb management"`

---

## Chunk 5: Character Management Fixes (Tasks 11-14) ✅ COMPLETE

**Prerequisite:** Tasks 1-10 complete. Task 7 adds `VOCATIONS` import and vocation dropdown to `edit-character/page.tsx`, removing vocation from the identity display section.

### Task 11: Bug 11 — Character identity display formatting

**Files:**
- Modify: `src/app/edit-character/page.tsx` (imports ~L29, identity display ~L595-616)
- **Verify**: `bash __verify__/tests/11_identity_formatting.sh`

- [ ] **Step 1: Add constant imports**

Add `RACES, CLASSES, BACKGROUNDS, KNIGHT_ORDERS` to the existing constants import block. (After Task 7, `VOCATIONS` is already imported here.)

```ts
import {
  ABILITY_NAMES,
  getAbilityModifier,
  calculateMaxHP,
  RACES,
  CLASSES,
  BACKGROUNDS,
  KNIGHT_ORDERS,
} from '@/lib/constants'
```

- [ ] **Step 2: Replace raw values with formatted names in identity section**

In the "Character Identity (Fixed)" grid (4 display fields remaining after Task 7 removed vocation), replace each raw value with a constants lookup + fallback. Pattern from `CharacterBanner.tsx:43-54`:

```tsx
<div>
  <span className="text-zinc-500">Race:</span>{' '}
  <span className="text-zinc-300">
    {RACES[character.race as keyof typeof RACES]?.name ?? character.race}
  </span>
</div>
<div>
  <span className="text-zinc-500">Class:</span>{' '}
  <span className="text-zinc-300">
    {CLASSES[character.class as keyof typeof CLASSES]?.name ?? character.class}
  </span>
</div>
<div>
  <span className="text-zinc-500">Background:</span>{' '}
  <span className="text-zinc-300">
    {BACKGROUNDS[character.background as keyof typeof BACKGROUNDS]?.name ?? character.background}
  </span>
</div>
<div>
  <span className="text-zinc-500">Order:</span>{' '}
  <span className="text-zinc-300">
    {KNIGHT_ORDERS[character.knight_order as keyof typeof KNIGHT_ORDERS]?.name ?? character.knight_order}
  </span>
</div>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git commit -m "fix: format character identity display names from constants"
```

---

### Task 12: Bug 10 — Edit save navigates back to profile

**Files:**
- Modify: `src/app/edit-character/page.tsx` (imports ~L20, hook setup, handleSave ~L202-241, state ~L58, UI ~L306-310)
- **Verify**: `bash __verify__/tests/12_edit_save_navigation.sh`

- [ ] **Step 1: Add `useInvalidateQueries` import and hook call**

Update hooks import:
```ts
import { useArmorSlots, useInvalidateQueries } from '@/lib/hooks'
```

Inside the component, after `const router = useRouter()`:
```ts
const { invalidateCharacter } = useInvalidateQueries()
```

- [ ] **Step 2: Replace end of `handleSave` success path**

Remove the last 3 lines of the success path:
```ts
// REMOVE:
setCharacter({ ...character, ...updates })
setSaveSuccess(true)
setSaving(false)
```

Replace with:
```ts
invalidateCharacter(user.id)
router.push('/profile')
```

No need to call `setSaving(false)` — component unmounts on navigation. Button shows "Saving..." until page transitions, which is good UX.

- [ ] **Step 3: Remove all `saveSuccess` state and references**

Delete throughout the file:
1. `const [saveSuccess, setSaveSuccess] = useState(false)` (~L58)
2. `setSaveSuccess(false)` in `updateField` (~L141)
3. `setSaveSuccess(false)` in `updateStat` (~L154)
4. `setSaveSuccess(false)` in `handleSave` error reset (~L207)
5. The entire `{saveSuccess && (...)}` UI block (~L306-310)

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git commit -m "fix: navigate to profile after saving character edits"
```

---

### Task 13: Bug 8 — Cache invalidation after character creation

**Files:**
- Modify: `src/app/create-character/page.tsx` (imports ~L15, handleSubmit ~L265, warnings dismiss ~L432-434)
- **Verify**: `bash __verify__/tests/13_create_char_cache.sh`

- [ ] **Step 1: Add `useInvalidateQueries` import and hook call**

Update hooks import:
```ts
import { useArmorSlots, useSkills, useInvalidateQueries } from '@/lib/hooks'
```

Inside the component, after `const router = useRouter()`:
```ts
const { invalidateCharacter } = useInvalidateQueries()
```

- [ ] **Step 2: Invalidate before navigation in `handleSubmit`**

Before `router.push('/profile')` (~L265):
```ts
invalidateCharacter(user.id)
router.push('/profile')
```

- [ ] **Step 3: Invalidate before navigation in warnings dismiss button**

In the "Continue to Profile" button onClick (~L432-434):
```ts
onClick={() => {
  setWarnings([])
  invalidateCharacter(user.id)
  router.push('/profile')
}}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git commit -m "fix: invalidate character cache after creation"
```

---

### Task 14: Bug 9 — CON and HP custom modifier changes adjust current HP

**Files:**
- Modify: `src/app/edit-character/page.tsx` (add helper, rewrite `updateStat` ~L145, add `updateHpCustomModifier`, update HP modifier input ~L442)
- **Verify**: `bash __verify__/tests/14_con_hp_adjustment.sh`
- **Checkpoint**: `bash __verify__/checkpoint_D.sh` — MUST pass before proceeding to Group E

**Behavior:** CON increase → fill HP to new max (edit page = out-of-combat, free heal). CON decrease → cap HP at new max only if current exceeds it. Same logic for `hp_custom_modifier` changes.

- [ ] **Step 1: Add `adjustHpForMaxChange` helper**

Add inside the component, before `updateField`:

```ts
function adjustHpForMaxChange(
  currentForm: EditableFields,
  newConScore: number,
  newCustomMod: number
): number {
  const oldMax = calculateMaxHP(currentForm.stats.con, currentForm.hp_custom_modifier)
  const newMax = calculateMaxHP(newConScore, newCustomMod)

  if (newMax > oldMax) {
    return newMax
  } else if (currentForm.hp_current > newMax) {
    return newMax
  }
  return currentForm.hp_current
}
```

- [ ] **Step 2: Rewrite `updateStat` with CON-specific HP logic**

Replace the existing `updateStat` function (after Task 12 removed `setSaveSuccess`):

```ts
function updateStat(stat: keyof CharacterStats, value: number) {
  if (!form) return
  const clamped = Math.max(1, Math.min(30, value))

  if (stat === 'con') {
    const newHp = adjustHpForMaxChange(form, clamped, form.hp_custom_modifier)
    setForm({
      ...form,
      stats: { ...form.stats, con: clamped },
      hp_current: newHp,
    })
  } else {
    setForm({
      ...form,
      stats: { ...form.stats, [stat]: clamped },
    })
  }
}
```

- [ ] **Step 3: Add `updateHpCustomModifier` handler**

```ts
function updateHpCustomModifier(value: number) {
  if (!form) return
  const newHp = adjustHpForMaxChange(form, form.stats.con, value)
  setForm({ ...form, hp_custom_modifier: value, hp_current: newHp })
}
```

- [ ] **Step 4: Wire up HP custom modifier input**

Update the `hp_custom_modifier` input onChange (~L442) from:
```tsx
onChange={(e) => updateField('hp_custom_modifier', parseInt(e.target.value) || 0)}
```
to:
```tsx
onChange={(e) => updateHpCustomModifier(parseInt(e.target.value) || 0)}
```

- [ ] **Step 5: Verify `maxHP` display is reactive**

No change needed — `const maxHP = calculateMaxHP(form.stats.con, form.hp_custom_modifier)` already recomputes on form state change.

- [ ] **Step 6: Verify build**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git commit -m "fix: adjust current HP when CON or HP modifier changes"
```

---

## Chunk 6: Weapon System Fixes (Tasks 15-18) ✅ COMPLETE

**Prerequisite:** Tasks 1-14 complete (or at minimum, no conflicting changes to weapon files).

**Architectural decision:** Templates become creation shortcuts, not persistent references. When a weapon is created from a template, ALL data (properties, range, versatile_dice) is copied to the weapon row. This makes weapons fully self-contained — simpler data model, no joins needed for display. `template_id`/`material_id` stay as informational references. This also fixes a latent bug: custom weapons never show properties because `WeaponCard` reads `weapon.template?.properties` (which is null for custom weapons).

### Task 15: DB migration — range columns + backfill

**Files:**
- Create: `supabase/migrations/011_weapon_self_contained.sql`
- **Verify**: `bash __verify__/tests/15_migration_file.sh`
- **Verify (manual)**: After `npm run db:push`, run `npm run db:types` and confirm `range_normal`, `range_long`, `versatile_dice` appear in `database.types.ts`

- [ ] **Step 1: Create migration file**

```sql
-- 011_weapon_self_contained.sql
-- Make character_weapons fully self-contained by copying all template data.
-- Part of "templates as creation shortcuts" architecture change.

-- Add missing columns to character_weapons
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS range_normal INT;
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS range_long INT;
ALTER TABLE character_weapons ADD COLUMN IF NOT EXISTS versatile_dice TEXT;

-- Backfill: copy template data into existing template-based weapons.
-- properties: TEXT[] on weapon_templates → JSONB on character_weapons (to_jsonb handles conversion)
-- range + versatile_dice: direct copy
UPDATE character_weapons cw
SET
  properties = COALESCE(cw.properties, to_jsonb(wt.properties)),
  range_normal = COALESCE(cw.range_normal, wt.range_normal),
  range_long = COALESCE(cw.range_long, wt.range_long),
  versatile_dice = COALESCE(cw.versatile_dice, wt.versatile_dice)
FROM weapon_templates wt
WHERE cw.template_id = wt.id
  AND cw.template_id IS NOT NULL;
```

Notes:
- `to_jsonb(wt.properties)` converts TEXT[] `{finesse,light}` to JSONB `["finesse","light"]`
- `COALESCE` preserves any manually-set values (won't overwrite custom data)
- Custom weapons (no template_id) are unaffected — their range stays NULL

- [ ] **Step 2: Push migration**

Run: `npm run db:push`
Expected: Migration applies, no errors.

- [ ] **Step 3: Regenerate types**

Run: `npm run db:types`
Expected: `database.types.ts` now includes `range_normal`, `range_long`, `versatile_dice` on `character_weapons`.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**
`git commit -m "migration: add range + versatile columns to character_weapons, backfill from templates"`

---

### Task 16: Type updates + creation fix + update function + ItemTooltip fix

**Files:**
- Modify: `src/lib/types.ts:247-267`
- Modify: `src/lib/db/characters.ts:1046-1061`
- Modify: `src/lib/db/characters.ts` (add after line 1134)
- Modify: `src/components/ui/ItemTooltip.tsx:35, 296-307`
- Modify: `src/components/character/WeaponSlotCard.tsx:206`
- **Verify**: `bash __verify__/tests/16_weapon_types_and_functions.sh`

- [ ] **Step 1: Update CharacterWeapon type**

In `src/lib/types.ts`, change the `CharacterWeapon` type (lines 247-267):

```ts
/** A weapon owned by a character */
export type CharacterWeapon = {
  id: string
  character_id: string
  name: string
  weapon_type: string | null
  material: string
  damage_dice: string | null
  damage_type: string | null
  properties: string[] | null          // was: Record<string, unknown> | null
  attachments: Record<string, unknown> | null
  is_magical: boolean
  is_equipped: boolean
  is_two_handed: boolean
  notes: string | null
  range_normal: number | null          // NEW
  range_long: number | null            // NEW
  versatile_dice: string | null        // NEW
  // Template references (new architecture)
  template_id: number | null
  material_id: number | null
  // Joined data
  template?: WeaponTemplate | null
  material_ref?: Material | null
}
```

Changes:
- `properties`: `Record<string, unknown> | null` → `string[] | null`
- Added `range_normal`, `range_long`, `versatile_dice`

- [ ] **Step 2: Fix `addWeaponFromTemplate` to copy all template data**

In `src/lib/db/characters.ts`, update the insert object (lines 1046-1061) to include:

```ts
const { data, error } = await supabase
  .from('character_weapons')
  .insert({
    character_id: characterId,
    template_id: templateId,
    material_id: materialId,
    name: options?.customName || template.name,
    weapon_type: template.category,
    damage_dice: template.damage_dice,
    damage_type: template.damage_type,
    properties: template.properties || [],       // NEW: copy properties
    range_normal: template.range_normal || null,  // NEW: copy range
    range_long: template.range_long || null,      // NEW: copy range
    versatile_dice: template.versatile_dice || null,  // NEW: copy versatile
    is_magical: options?.isMagical || false,
    is_two_handed: template.properties?.includes('two-handed') || false,
    notes: options?.notes || template.description,
  })
  .select()
  .single()
```

- [ ] **Step 3: Add `updateCharacterWeapon` function**

In `src/lib/db/characters.ts`, add after `deleteCharacterWeapon` (after line 1134):

```ts
/**
 * Update a character weapon's fields
 */
export async function updateCharacterWeapon(
  weaponId: string,
  updates: {
    name?: string
    damage_dice?: string | null
    damage_type?: string | null
    weapon_type?: string | null
    properties?: string[]
    range_normal?: number | null
    range_long?: number | null
    is_two_handed?: boolean
    is_magical?: boolean
    notes?: string | null
  }
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('character_weapons')
    .update(updates)
    .eq('id', weaponId)

  if (error) return { error: error.message }
  return { error: null }
}
```

- [ ] **Step 4: Fix ItemTooltip to handle string[] properties**

In `src/components/ui/ItemTooltip.tsx`:

Update the `ItemDetails` type (line 35):
```ts
properties?: Record<string, unknown> | string[]
```

Update the properties rendering section (lines 296-307). Replace:
```tsx
{details.properties && Object.keys(details.properties).length > 0 && (
  <div>
    <h4 className="text-xs font-medium text-vellum-400 uppercase tracking-wide mb-2">
      Properties
    </h4>
    <div className="bg-grimoire-900 rounded-lg p-3 text-sm border border-sepia-800">
      {Object.entries(details.properties).map(([key, value]) => (
        <div key={key} className="flex justify-between py-1">
          <span className="text-vellum-400 capitalize">{key.replace(/_/g, ' ')}</span>
          <span className="text-vellum-200">{String(value)}</span>
        </div>
      ))}
```

With:
```tsx
{details.properties && (Array.isArray(details.properties) ? details.properties.length > 0 : Object.keys(details.properties).length > 0) && (
  <div>
    <h4 className="text-xs font-medium text-vellum-400 uppercase tracking-wide mb-2">
      Properties
    </h4>
    <div className="bg-grimoire-900 rounded-lg p-3 text-sm border border-sepia-800">
      {Array.isArray(details.properties) ? (
        <div className="flex flex-wrap gap-2">
          {details.properties.map((prop, i) => (
            <span key={i} className="text-vellum-200 capitalize bg-grimoire-800 px-2 py-0.5 rounded">
              {prop}
            </span>
          ))}
        </div>
      ) : (
        Object.entries(details.properties).map(([key, value]) => (
          <div key={key} className="flex justify-between py-1">
            <span className="text-vellum-400 capitalize">{key.replace(/_/g, ' ')}</span>
            <span className="text-vellum-200">{String(value)}</span>
          </div>
        ))
      )}
```

Why both formats: weapon properties are string lists (`["finesse", "light"]`), armor properties are key-value maps (`{"silvered": true}`). Semantically different, need different rendering.

- [ ] **Step 5: Fix WeaponSlotCard properties pass-through**

In `src/components/character/WeaponSlotCard.tsx` line 206, change:
```ts
properties: weapon.properties ?? undefined,
```
To:
```ts
properties: (weapon.properties as string[] | Record<string, unknown>) ?? undefined,
```

Cast bridges `CharacterWeapon.properties: string[]` to `ItemDetails.properties: string[] | Record`.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: PASS. The type change from `Record` to `string[]` may surface errors — fix any remaining consumers.

- [ ] **Step 7: Commit**
`git commit -m "feat: self-contained weapons — copy template data, fix properties type, add update function"`

---

### Task 17: WeaponCard display fixes + AddWeaponModal range UX

**Files:**
- Modify: `src/components/inventory/equipment/WeaponCard.tsx`
- Modify: `src/components/inventory/modals/AddWeaponModal.tsx:398-420`
- **Verify**: `bash __verify__/tests/17_weapon_card_fixes.sh`

- [ ] **Step 1: Fix WeaponCard to read weapon.properties directly + show range**

Replace the current properties/range display in WeaponCard (lines 43-55):

```tsx
<div className="text-sm text-zinc-400 mt-1">
  {weapon.damage_dice && (
    <span className="text-red-400 font-mono">{weapon.damage_dice}</span>
  )}
  {weapon.damage_type && (
    <span className="ml-2">{weapon.damage_type}</span>
  )}
  {weapon.properties && weapon.properties.length > 0 && (
    <span className="ml-2 text-zinc-500">
      • {weapon.properties.join(', ')}
    </span>
  )}
  {weapon.range_normal && (
    <span className="ml-2 text-zinc-500">
      — {weapon.range_normal}/{weapon.range_long || '—'} ft
    </span>
  )}
</div>
```

Key change: reads `weapon.properties` directly instead of `weapon.template?.properties`.

- [ ] **Step 2: Add edit button to WeaponCard**

First, update props interface (lines 7-11):
```ts
interface WeaponCardProps {
  weapon: CharacterWeapon
  isDeleting: boolean
  onEdit: () => void     // NEW
  onDelete: () => void
}
```

Update destructuring:
```ts
export function WeaponCard({ weapon, isDeleting, onEdit, onDelete }: WeaponCardProps) {
```

Replace the button container (lines 61-86). Change from horizontal to vertical layout with edit button above delete:

```tsx
<div className="flex flex-col items-end gap-1 ml-4">
  <button
    onClick={onEdit}
    className="text-xs px-2 py-1 text-zinc-400 hover:text-blue-400 transition-colors"
    title="Edit weapon"
  >
    ✏️
  </button>
  {showConfirm ? (
    <div className="flex items-center gap-2">
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded transition-colors"
      >
        Confirm
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded transition-colors"
      >
        Cancel
      </button>
    </div>
  ) : (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-xs px-2 py-1 text-zinc-400 hover:text-red-400 transition-colors"
    >
      🗑️
    </button>
  )}
</div>
```

Vertical stack: edit (pencil) on top, delete (trash) below. When delete's confirm activates, it expands horizontally in its own row.

- [ ] **Step 3: Add helper label to AddWeaponModal range fields**

In `src/components/inventory/modals/AddWeaponModal.tsx`, after the range inputs section (after line 420), add:

```tsx
<p className="text-xs text-zinc-500 -mt-1">
  For ranged or thrown weapons. Leave blank for melee-only.
</p>
```

Why range fields stay visible for all categories: thrown melee weapons (Dagger, Javelin, Spear, Handaxe, Light Hammer) are `simple_melee` but have range values (20/60, 30/120 ft). Hiding range for melee would break custom thrown weapons.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**
`git commit -m "fix: weapon card reads properties directly, shows range, adds edit button"`

---

### Task 18: Weapon editing (EditWeaponModal + WeaponsTab wiring)

**Files:**
- Create: `src/components/inventory/modals/EditWeaponModal.tsx`
- Modify: `src/components/inventory/modals/index.ts`
- Modify: `src/components/inventory/equipment/WeaponsTab.tsx`
- **Verify**: `bash __verify__/tests/18_edit_weapon_modal.sh`
- **Checkpoint**: `bash __verify__/checkpoint_E.sh` — MUST pass. This is the final checkpoint.

- [ ] **Step 1: Create EditWeaponModal**

Create `src/components/inventory/modals/EditWeaponModal.tsx`. Self-contained modal mirroring AddWeaponModal's custom mode layout. All fields pre-filled from weapon. Calls `updateCharacterWeapon()` on save.

Props: `{ weapon: CharacterWeapon; onClose: () => void; onSuccess: () => void; setError: (e: string | null) => void }`

Form fields: name (required), damage_dice, damage_type (13-option select), weapon_type (6-option select), properties (comma-separated text), range_normal, range_long, is_two_handed (checkbox), is_magical (checkbox), notes (textarea).

```tsx
'use client'

import { useState } from 'react'
import { updateCharacterWeapon } from '@/lib/db/characters'
import type { CharacterWeapon } from '@/lib/types'

export interface EditWeaponModalProps {
  weapon: CharacterWeapon
  onClose: () => void
  onSuccess: () => void
  setError: (e: string | null) => void
}

export function EditWeaponModal({ weapon, onClose, onSuccess, setError }: EditWeaponModalProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(weapon.name)
  const [damageDice, setDamageDice] = useState(weapon.damage_dice || '')
  const [damageType, setDamageType] = useState(weapon.damage_type || 'slashing')
  const [weaponType, setWeaponType] = useState(weapon.weapon_type || 'simple_melee')
  const [properties, setProperties] = useState(weapon.properties?.join(', ') || '')
  const [rangeNormal, setRangeNormal] = useState(weapon.range_normal?.toString() || '')
  const [rangeLong, setRangeLong] = useState(weapon.range_long?.toString() || '')
  const [isTwoHanded, setIsTwoHanded] = useState(weapon.is_two_handed)
  const [isMagical, setIsMagical] = useState(weapon.is_magical)
  const [notes, setNotes] = useState(weapon.notes || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    setError(null)

    const parsedProperties = properties
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(Boolean)

    const { error } = await updateCharacterWeapon(weapon.id, {
      name: name.trim(),
      damage_dice: damageDice.trim() || null,
      damage_type: damageType,
      weapon_type: weaponType,
      properties: parsedProperties,
      range_normal: rangeNormal ? parseInt(rangeNormal) : null,
      range_long: rangeLong ? parseInt(rangeLong) : null,
      is_two_handed: isTwoHanded,
      is_magical: isMagical,
      notes: notes.trim() || null,
    })

    setSaving(false)

    if (error) {
      setError(error)
      return
    }

    onSuccess()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 rounded-xl border border-zinc-700 max-w-lg w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h2 className="text-lg font-semibold">Edit Weapon</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">✕</button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
          </div>

          {/* Damage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Damage Dice</label>
              <input type="text" value={damageDice} onChange={e => setDamageDice(e.target.value)}
                placeholder="e.g., 1d8" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Damage Type</label>
              <select value={damageType} onChange={e => setDamageType(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500">
                <option value="slashing">Slashing</option>
                <option value="piercing">Piercing</option>
                <option value="bludgeoning">Bludgeoning</option>
                <option value="fire">Fire</option>
                <option value="cold">Cold</option>
                <option value="lightning">Lightning</option>
                <option value="thunder">Thunder</option>
                <option value="acid">Acid</option>
                <option value="poison">Poison</option>
                <option value="necrotic">Necrotic</option>
                <option value="radiant">Radiant</option>
                <option value="psychic">Psychic</option>
                <option value="force">Force</option>
              </select>
            </div>
          </div>

          {/* Weapon Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Weapon Category</label>
            <select value={weaponType} onChange={e => setWeaponType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500">
              <option value="simple_melee">Simple Melee</option>
              <option value="simple_ranged">Simple Ranged</option>
              <option value="martial_melee">Martial Melee</option>
              <option value="martial_ranged">Martial Ranged</option>
              <option value="exotic">Exotic</option>
              <option value="improvised">Improvised</option>
            </select>
          </div>

          {/* Properties */}
          <div>
            <label className="block text-sm font-medium mb-1">Properties</label>
            <input type="text" value={properties} onChange={e => setProperties(e.target.value)}
              placeholder="e.g., finesse, versatile, light (comma-separated)"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            <p className="text-xs text-zinc-500 mt-1">
              Common: finesse, versatile, light, heavy, two-handed, thrown, reach, loading
            </p>
          </div>

          {/* Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Range (Normal)</label>
              <input type="number" value={rangeNormal} onChange={e => setRangeNormal(e.target.value)}
                placeholder="e.g., 80" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Range (Long)</label>
              <input type="number" value={rangeLong} onChange={e => setRangeLong(e.target.value)}
                placeholder="e.g., 320" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500" />
            </div>
          </div>
          <p className="text-xs text-zinc-500 -mt-2">
            For ranged or thrown weapons. Leave blank for melee-only.
          </p>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isTwoHanded} onChange={e => setIsTwoHanded(e.target.checked)} className="rounded" />
              <span className="text-sm">🗡️ Two-Handed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isMagical} onChange={e => setIsMagical(e.target.checked)} className="rounded" />
              <span className="text-sm">✨ Magical</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Description / Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:border-zinc-500 resize-none"
              placeholder="Special properties, enchantments, lore..." />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-zinc-700">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !name.trim()}
            className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Export from barrel**

In `src/components/inventory/modals/index.ts`, add:
```ts
export { EditWeaponModal } from './EditWeaponModal'
export type { EditWeaponModalProps } from './EditWeaponModal'
```

- [ ] **Step 3: Wire up WeaponsTab**

In `src/components/inventory/equipment/WeaponsTab.tsx`:

Add import:
```ts
import { deleteCharacterWeapon } from '@/lib/db/characters'
import type { CharacterWeapon } from '@/lib/types'
import { WeaponCard } from './WeaponCard'
import { EditWeaponModal } from '../modals'
```

Add state (after `searchQuery` state, line 24):
```ts
const [editingWeapon, setEditingWeapon] = useState<CharacterWeapon | null>(null)
```

Add `onEdit` prop to WeaponCard (inside the map, around line 86-91):
```tsx
<WeaponCard
  key={weapon.id}
  weapon={weapon}
  isDeleting={deletingId === weapon.id}
  onEdit={() => setEditingWeapon(weapon)}
  onDelete={() => handleDelete(weapon.id)}
/>
```

Render EditWeaponModal at the end, before the closing `</div>` (before line 101):
```tsx
{editingWeapon && (
  <EditWeaponModal
    weapon={editingWeapon}
    onClose={() => setEditingWeapon(null)}
    onSuccess={() => {
      setEditingWeapon(null)
      onWeaponDeleted()
    }}
    setError={setError}
  />
)}
```

Note: `onWeaponDeleted` callback already invalidates the weapons cache (EquipmentSection line 89 passes `onWeaponsChanged`). Reusing it for edit success is correct.

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**
`git commit -m "feat: add weapon editing modal and wire up edit flow"`

---

## Verification

After all tasks complete:

| Bug | Test |
|-----|------|
| 1 | Edit character → change vocation to Herbalist → save → brew page accessible |
| 2 | Select element → click same → deselects. With duplicate elements, each button highlights independently |
| 3 | Delete herb → UI immediately reflects change |
| 4 | Mix elixir + bomb effects → error says "Cannot mix multiple types in one brew" |
| 5 | INT 16 (+3) + Nature proficient at level 3 (prof +2) → foraging modifier +5 |
| 6 | INT 16 (+3) → 3 max sessions. INT 10 (+0) → 1 session (minimum) |
| 7 | Inventory → Herbs tab → Add Herbs → search → select → add → appears in inventory |
| Profile cleanup | No code references `profile.foragingModifier`, `profile.brewingModifier`, `profile.maxForagingSessions`, or `profile.isHerbalist` |
| 8 | Create new character → redirected to profile → character sheet appears immediately (no "Create Your Knight" flash) |
| 9 | Edit → CON 10→14 → HP fills to new max. CON 14→10 → HP caps at new max if above. HP modifier +4 → HP fills to new max. HP below max + CON decrease that doesn't cross current → HP unchanged. |
| 10 | Edit → change name → Save → navigates to `/profile` showing updated name. No "Changes saved" message. |
| 11 | Edit → "Character Identity" shows "High Elf" not "high_elf", "Blood Hunter" not "blood_hunter", "Native-Knight" not "native_knight", "Order of Fiendwreathers" not "fiendwreathers" |
| 12 (range crash) | Add custom ranged weapon with range 80/320 → saves without error → range displays on card |
| 12 (properties) | Template weapon shows properties on card. Custom weapon with properties shows them too |
| 12 (UX) | Range fields show helper: "For ranged or thrown weapons. Leave blank for melee-only." |
| 12 (tooltip) | Click a weapon in weapon slots → tooltip shows properties as tags (not key-value) |
| 13 (edit) | Click ✏️ on any weapon → modal opens pre-filled → change name → save → card shows updated name |
| 13 (all fields) | Edit damage type, properties, range, notes → all persist after save |
| Backfill | Existing template weapons now show properties on their cards (backfilled from templates) |
| Build | `npm run build` passes with zero type errors |

---

## Risks

1. **Profile type cascade (Task 6):** Largest blast radius. TypeScript compiler will catch everything — run `npm run build` after the type change and fix each error before proceeding.

2. **Nature skill name casing:** Using case-insensitive `.toLowerCase() === 'nature'`. Fallback is just INT modifier if not found.

3. **RPC `remove_character_herbs` (Task 9):** Optimistic update ensures immediate UI response regardless of RPC behavior. Full invalidation follows as safety net. If the RPC itself is buggy, the data will revert on next fetch — document for user if observed.

4. **CharacterUpdate doesn't include vocation (Task 7):** Must add `'vocation'` to the Pick union in the type AND verify Supabase allows updating the `vocation` column (RLS policies should permit owner updates).

5. **Stale closure on warnings (pre-existing, out of scope for Bug 8):** `create-character/page.tsx` L259 checks `warnings.length > 0` using stale closure — warnings from money/armor/recipe setup are effectively silent on first submit. Character IS created (check is after `createCharacter` returns), so Bug 8's invalidation on the happy path is correct. Log as separate bug.

6. **"Fill to max" on CON increase is intentional (Bug 9):** Raising CON fills HP to new max — effectively a free heal. Design choice for out-of-combat edit context. `adjustHpForMaxChange` helper makes switching to delta-preserving behavior a one-line change if needed later.

7. **Task ordering is load-bearing (Chunk 5):** Task 12 removes `setSaveSuccess(false)` from `updateStat`/`updateField`. Task 14 then rewrites `updateStat`. Reversing them would force Task 14 to also handle cleanup.

8. **Migration push required before types work (Chunk 6):** Task 15 must fully complete (push + regenerate types) before Task 16 can begin. The `database.types.ts` regeneration makes `range_normal` etc. available in Supabase's type-checking.

9. **ItemTooltip dual-format properties (Chunk 6):** The `Array.isArray()` branch handles weapons (string[]) while `Object.entries()` handles armor (Record). Semantically different types rendered differently — safer than normalizing.

10. **`versatile_dice` bonus column (Chunk 6):** Not in original spec but directly supports the "copy ALL template data" architecture. One column, no UI display change. Cut if scope is a concern.
